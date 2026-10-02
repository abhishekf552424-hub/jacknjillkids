-- =========================================================================
-- RUN THIS ONCE IN SUPABASE BEFORE DEPLOYING THE OCTOBER 2026 RELEASE
-- Supabase Dashboard → SQL Editor → New query → paste this whole file → Run
--
-- It contains migrations 0010 (security) and 0011 (order engine), in order.
-- Safe to run more than once. The last query prints a check table: every row
-- must say "ok".
-- =========================================================================

-- =========================================================================
-- 0010 — Security hardening (Phase 0)
--
-- C2: A signed-in customer could UPDATE their own profiles row (policy
-- "profiles_update_own") and set role = 'super_admin', or flip is_active /
-- cod_blocked. RLS cannot restrict columns, so a trigger now rejects changes
-- to privileged columns unless the caller is the service role, a direct
-- database admin connection, or a super_admin.
--
-- Run once in the Supabase SQL editor (safe to re-run).
-- =========================================================================

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '');
begin
  -- Trusted callers: service-role API key (server routes) and direct DB sessions
  -- (SQL editor, migrations), which carry no end-user JWT.
  if jwt_role = 'service_role' or (jwt_role = '' and auth.uid() is null) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.role, 'customer') <> 'customer'
       and not public.is_super_admin(auth.uid()) then
      raise exception 'Not allowed to assign a privileged role'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if (new.role is distinct from old.role
      or new.is_active is distinct from old.is_active
      or new.cod_blocked is distinct from old.cod_blocked
      or new.id is distinct from old.id)
     and not public.is_super_admin(auth.uid()) then
    raise exception 'Not allowed to change role, is_active or cod_blocked'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_columns on public.profiles;
create trigger protect_profile_privileged_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- Tighten the self-update policy so the row can only stay the caller's own.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Payments: a Razorpay payment id can settle at most one order.
create unique index if not exists orders_razorpay_payment_id_uniq
  on public.orders (razorpay_payment_id)
  where razorpay_payment_id is not null;

-- Audit query (run after applying): any non-customer roles you do not recognise
-- were possibly self-assigned before this fix and should be reset.
--   select id, email, role, updated_at from public.profiles where role <> 'customer' order by updated_at desc;

-- =========================================================================
-- 0011 — Order engine: atomic stock reservation (Phase 2)
--
-- Before: /api/orders/create read stock, inserted the order, then wrote
-- `stock = old - qty` per item in separate requests. Two parents buying the
-- last frock at once could both succeed (oversell), unpaid Razorpay orders kept
-- stock forever, and cancelling an order never returned stock.
--
-- Now:
--   place_order()          one transaction: decrement every variant only if
--                          enough stock, insert order + items + history +
--                          coupon usage; any shortage rolls everything back.
--   release_order_stock()  give an order's stock back exactly once.
--   expire_unpaid_orders() cancel online orders left unpaid and release stock.
--   reclaim_order_stock()  a late payment on an expired order takes stock
--                          again if it is still there.
--   adjust_stock()         atomic +/- for returns and exchanges.
-- All are callable only with the service role (server routes).
--
-- Run once in the Supabase SQL editor after 0010 (safe to re-run).
-- =========================================================================

alter table public.orders add column if not exists stock_released boolean not null default false;
alter table public.orders add column if not exists reserved_until timestamptz;
create index if not exists orders_unpaid_idx on public.orders (created_at)
  where payment_method = 'razorpay' and payment_status = 'pending' and status = 'placed';

-- ---------------------------------------------------------------------------
create or replace function public.place_order(p_order jsonb, p_items jsonb, p_coupon_id uuid default null)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
  it jsonb;
  n int;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'NO_ITEMS' using errcode = 'P0001';
  end if;

  -- Decrement in a fixed order (by variant id) so concurrent orders cannot deadlock.
  for it in
    select x from jsonb_array_elements(p_items) x order by (x->>'variant_id')
  loop
    if coalesce((it->>'quantity')::int, 0) < 1 then
      raise exception 'BAD_QUANTITY' using errcode = 'P0001';
    end if;
    update public.product_variants
       set stock_qty = stock_qty - (it->>'quantity')::int
     where id = (it->>'variant_id')::uuid
       and stock_qty >= (it->>'quantity')::int;
    get diagnostics n = row_count;
    if n = 0 then
      raise exception 'OUT_OF_STOCK:%', it->>'variant_id' using errcode = 'P0001';
    end if;
  end loop;

  insert into public.orders (
    user_id, guest_email, guest_phone, status, subtotal, discount, shipping_fee, tax, total,
    coupon_code, payment_status, payment_method, shipping_address, reserved_until, gift_wrap, gift_message
  ) values (
    nullif(p_order->>'user_id', '')::uuid,
    p_order->>'guest_email',
    p_order->>'guest_phone',
    'placed',
    (p_order->>'subtotal')::numeric,
    coalesce((p_order->>'discount')::numeric, 0),
    coalesce((p_order->>'shipping_fee')::numeric, 0),
    coalesce((p_order->>'tax')::numeric, 0),
    (p_order->>'total')::numeric,
    p_order->>'coupon_code',
    p_order->>'payment_status',
    p_order->>'payment_method',
    p_order->'shipping_address',
    nullif(p_order->>'reserved_until', '')::timestamptz,
    coalesce((p_order->>'gift_wrap')::boolean, false),
    p_order->>'gift_message'
  )
  returning * into o;

  insert into public.order_items (order_id, variant_id, product_name, variant_label, image_url, quantity, price_at_purchase)
  select o.id,
         (x->>'variant_id')::uuid,
         x->>'product_name',
         x->>'variant_label',
         x->>'image_url',
         (x->>'quantity')::int,
         (x->>'price_at_purchase')::numeric
    from jsonb_array_elements(p_items) x;

  insert into public.order_status_history (order_id, status, note) values (o.id, 'placed', 'Order placed');

  if p_coupon_id is not null then
    insert into public.coupon_usages (coupon_id, user_id, order_id) values (p_coupon_id, o.user_id, o.id);
  end if;

  return o;
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.release_order_stock(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v uuid;
begin
  update public.orders set stock_released = true
   where id = p_order_id and stock_released = false
  returning id into v;
  if v is null then
    return false; -- already released (idempotent)
  end if;

  update public.product_variants pv
     set stock_qty = pv.stock_qty + q.qty
    from (select variant_id, sum(quantity)::int as qty
            from public.order_items
           where order_id = p_order_id and variant_id is not null
           group by variant_id) q
   where pv.id = q.variant_id;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.expire_unpaid_orders(p_minutes int default 45)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n int := 0;
begin
  for r in
    select id from public.orders
     where payment_method = 'razorpay'
       and payment_status = 'pending'
       and status = 'placed'
       and coalesce(reserved_until, created_at + make_interval(mins => p_minutes)) < now()
     for update skip locked
  loop
    update public.orders set status = 'cancelled', payment_status = 'failed', updated_at = now() where id = r.id;
    perform public.release_order_stock(r.id);
    insert into public.order_status_history (order_id, status, note)
    values (r.id, 'cancelled', 'Online payment not completed in time — stock released');
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.reclaim_order_stock(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  it record;
  n int;
  released boolean;
begin
  select stock_released into released from public.orders where id = p_order_id for update;
  if released is distinct from true then
    return true; -- stock is still held by this order
  end if;
  begin
    for it in
      select variant_id, sum(quantity)::int as qty
        from public.order_items
       where order_id = p_order_id and variant_id is not null
       group by variant_id
       order by variant_id
    loop
      update public.product_variants set stock_qty = stock_qty - it.qty
       where id = it.variant_id and stock_qty >= it.qty;
      get diagnostics n = row_count;
      if n = 0 then
        raise exception 'NO_STOCK';
      end if;
    end loop;
    update public.orders set stock_released = false where id = p_order_id;
    return true;
  exception when others then
    return false; -- the block's decrements are rolled back
  end;
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.adjust_stock(p_variant_id uuid, p_delta int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v int;
begin
  update public.product_variants
     set stock_qty = greatest(0, stock_qty + p_delta)
   where id = p_variant_id
  returning stock_qty into v;
  return v;
end;
$$;

-- Server-only: never callable by browsers (anon / signed-in customers).
revoke all on function public.place_order(jsonb, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.release_order_stock(uuid) from public, anon, authenticated;
revoke all on function public.expire_unpaid_orders(int) from public, anon, authenticated;
revoke all on function public.reclaim_order_stock(uuid) from public, anon, authenticated;
revoke all on function public.adjust_stock(uuid, int) from public, anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb, uuid) to service_role;
grant execute on function public.release_order_stock(uuid) to service_role;
grant execute on function public.expire_unpaid_orders(int) to service_role;
grant execute on function public.reclaim_order_stock(uuid) to service_role;
grant execute on function public.adjust_stock(uuid, int) to service_role;

-- Orders that were cancelled before this migration never returned their stock;
-- mark them released so a later status change cannot release twice.
update public.orders set stock_released = true where status = 'cancelled' and stock_released = false;

-- =========================================================================
-- CHECK: every row should say "ok"
-- =========================================================================
select 'profile role guard (0010)' as item,
       case when exists (select 1 from pg_trigger where tgname = 'protect_profile_privileged_columns') then 'ok' else 'MISSING' end as status
union all
select 'place_order() (0011)', case when to_regprocedure('public.place_order(jsonb,jsonb,uuid)') is not null then 'ok' else 'MISSING' end
union all
select 'expire_unpaid_orders() (0011)', case when to_regprocedure('public.expire_unpaid_orders(integer)') is not null then 'ok' else 'MISSING' end
union all
select 'orders.stock_released column (0011)', case when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'stock_released') then 'ok' else 'MISSING' end;
