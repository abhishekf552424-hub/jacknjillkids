-- =========================================================================
-- 0016 — Final security audit (Oct 2026)
-- Safe to re-run. Nothing is deleted; policies are tightened in place.
-- =========================================================================

-- 1. Direct database writes with an Owner/Staff login are no longer allowed.
--    Every admin change goes through the website's server (service role),
--    which checks the role and the 2-step login first. Only the developer
--    account keeps direct access (for emergencies).
alter policy "age_groups_admin"         on public.age_groups           using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "categories_admin"         on public.categories           using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "cms_admin"                on public.cms_pages            using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "coupon_usages_admin"      on public.coupon_usages        using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "coupons_admin"            on public.coupons              using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "faqs_admin"               on public.faqs                 using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "homepage_admin"           on public.homepage_sections    using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "order_items_admin"        on public.order_items          using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "osh_admin"                on public.order_status_history using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "orders_admin_write"       on public.orders               using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "product_age_groups_admin" on public.product_age_groups   using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "bundles_admin_write"      on public.product_bundles      using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "product_images_admin"     on public.product_images       using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "product_variants_admin"   on public.product_variants     using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "products_admin"           on public.products             using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "returns_admin"            on public.returns              using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "reviews_admin"            on public.reviews              using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "stock_notif_admin_all"    on public.stock_notifications  using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "trust_admin"              on public.trust_badges         using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
alter policy "rev_img_owner_admin"      on public.review_images        using (public.is_super_admin(auth.uid()) or exists (select 1 from public.reviews r where r.id = review_images.review_id and r.user_id = auth.uid()));

-- 2. Login codes are only ever read by the server (no one can fetch their hash).
alter policy "admin_otp_service" on public.admin_otp_codes using (false) with check (false);

-- 3. Coupon codes are private (checked by the server); social links are public.
alter policy "coupons_read" on public.coupons using (public.is_admin(auth.uid()));
alter policy "settings_public_read" on public.settings using (key = any (array['shipping','trust_stats','contact_info','brand','social']));

-- 4. Contact / support forms are saved by the server with rate limits;
--    block direct inserts that would skip them.
alter policy "contact_insert"           on public.contact_submissions      with check (false);
alter policy "tickets_public_insert"    on public.support_tickets          with check (false);
alter policy "ticket_msg_public_insert" on public.support_ticket_messages  with check (false);

-- 5. Faster security checks: evaluate auth.uid() once per query, not per row.
do $$
declare p record; q text; w text;
begin
  for p in select * from pg_policies where schemaname = 'public' loop
    q := p.qual; w := p.with_check;
    if q is not null and q like '%auth.uid()%' and q not like '%( SELECT auth.uid()%' then
      q := replace(q, 'auth.uid()', '(select auth.uid())');
      execute format('alter policy %I on %I.%I using (%s)', p.policyname, p.schemaname, p.tablename, q);
    end if;
    if w is not null and w like '%auth.uid()%' and w not like '%( SELECT auth.uid()%' then
      w := replace(w, 'auth.uid()', '(select auth.uid())');
      execute format('alter policy %I on %I.%I with check (%s)', p.policyname, p.schemaname, p.tablename, w);
    end if;
  end loop;
end $$;

-- 6. Indexes for foreign keys (faster order, review and support pages).
create index if not exists idx_coupon_usages_coupon   on public.coupon_usages(coupon_id);
create index if not exists idx_coupon_usages_order    on public.coupon_usages(order_id);
create index if not exists idx_coupon_usages_user     on public.coupon_usages(user_id);
create index if not exists idx_order_items_variant    on public.order_items(variant_id);
create index if not exists idx_osh_changed_by         on public.order_status_history(changed_by);
create index if not exists idx_pag_age_group          on public.product_age_groups(age_group_id);
create index if not exists idx_returns_order          on public.returns(order_id);
create index if not exists idx_returns_exchange_var   on public.returns(exchange_variant_id);
create index if not exists idx_review_images_review   on public.review_images(review_id);
create index if not exists idx_reviews_user           on public.reviews(user_id);
create index if not exists idx_ticket_msgs_ticket     on public.support_ticket_messages(ticket_id);
create index if not exists idx_ticket_msgs_author     on public.support_ticket_messages(author_id);
create index if not exists idx_tickets_order          on public.support_tickets(order_id);
create index if not exists idx_tickets_user           on public.support_tickets(user_id);
create index if not exists idx_wishlists_product      on public.wishlists(product_id);
create index if not exists idx_cart_items_variant     on public.cart_items(variant_id);
create index if not exists idx_audit_logs_admin       on public.audit_logs(admin_id);
create index if not exists idx_admin_invites_by       on public.admin_invites(invited_by);
create index if not exists idx_bundles_child_product  on public.product_bundles(child_product_id);
create index if not exists idx_bundles_child_variant  on public.product_bundles(child_variant_id);

-- 7. Size exchange: columns the exchange feature needs.
alter table public.orders  add column if not exists delivered_at timestamptz;
alter table public.returns add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.returns add column if not exists variant_id uuid references public.product_variants(id) on delete set null;
alter table public.returns add column if not exists order_item_id uuid references public.order_items(id) on delete set null;
alter table public.returns add column if not exists type text not null default 'return';
alter table public.returns add column if not exists updated_at timestamptz not null default now();
alter table public.returns add column if not exists stock_applied boolean not null default false;
create index if not exists idx_returns_user    on public.returns(user_id);
create index if not exists idx_returns_variant on public.returns(variant_id);
alter table public.returns drop constraint if exists returns_status_check;
alter table public.returns add constraint returns_status_check check (status in ('requested','in_progress','approved','rejected','refunded'));

-- 8. Rate limits shared by every server instance (contact, tracking, checkout…).
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits int not null default 0
);
alter table public.rate_limits enable row level security; -- no policies: server only

create or replace function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare h int;
begin
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into h;
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '2 days';
  end if;
  return h <= p_max;
end;
$$;
revoke all on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

-- 9. Coupons: limits are checked inside the order transaction with the coupon
--    row locked, so 20 checkouts at once cannot all use a "1 per customer" code.
--    A cancelled / expired order gives its coupon use back (not counted).
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
  c public.coupons;
  used int;
  v_user uuid := nullif(p_order->>'user_id', '')::uuid;
  v_email text := lower(nullif(trim(p_order->>'guest_email'), ''));
  v_phone text := right(regexp_replace(coalesce(p_order->'shipping_address'->>'phone', p_order->>'guest_phone', ''), '\D', '', 'g'), 10);
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'NO_ITEMS' using errcode = 'P0001';
  end if;

  if p_coupon_id is not null then
    select * into c from public.coupons where id = p_coupon_id for update;
    if not found or not c.is_active
       or (c.valid_from is not null and c.valid_from > now())
       or (c.valid_to is not null and c.valid_to < now()) then
      raise exception 'COUPON_INVALID' using errcode = 'P0001';
    end if;
    if c.usage_limit is not null then
      -- uses by cancelled / expired orders don't count
      select count(*) into used
        from public.coupon_usages u join public.orders x on x.id = u.order_id
       where u.coupon_id = c.id and x.status <> 'cancelled';
      if used >= c.usage_limit then
        raise exception 'COUPON_USED_UP' using errcode = 'P0001';
      end if;
    end if;
    if coalesce(c.per_user_limit, 0) > 0 then
      select count(*) into used
        from public.orders x
       where x.coupon_code = c.code
         and x.status <> 'cancelled'
         and (
              (v_user is not null and x.user_id = v_user)
           or (v_email is not null and lower(x.guest_email) = v_email)
           or (length(v_phone) = 10 and right(regexp_replace(coalesce(x.shipping_address->>'phone', x.guest_phone, ''), '\D', '', 'g'), 10) = v_phone)
         );
      if used >= c.per_user_limit then
        raise exception 'COUPON_LIMIT' using errcode = 'P0001';
      end if;
    end if;
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
    v_user,
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

-- 10. Mark an online order paid in one locked step, so a late payment and the
--     45-minute expiry can never interleave (no overselling).
create or replace function public.mark_order_paid(p_order_id uuid, p_payment_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
  ok boolean := true;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then return 'not_found'; end if;
  if o.payment_status = 'paid' then return 'already_paid'; end if;
  if o.stock_released then
    ok := public.reclaim_order_stock(p_order_id);
  end if;
  update public.orders
     set payment_status = 'paid',
         razorpay_payment_id = p_payment_id,
         status = case when ok then 'confirmed' else 'cancelled' end,
         updated_at = now()
   where id = p_order_id;
  return case when ok then 'paid' else 'paid_needs_refund' end;
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb, uuid) to service_role;
grant execute on function public.mark_order_paid(uuid, text) to service_role;
