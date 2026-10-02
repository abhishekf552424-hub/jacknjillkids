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
