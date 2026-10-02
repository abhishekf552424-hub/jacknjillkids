-- =========================================================================
-- 0012 — Admin roles like Purasatva + remove the pincode feature
--
-- Roles (was: super_admin / order_manager / content_manager):
--   super_admin  developer: everything, incl. payment keys and tracking codes
--   owner        the shop owner: everything a shop needs, manages staff
--   staff        orders, returns, support and stock only (no money reports,
--                no prices, no settings)
-- Existing order_manager / content_manager accounts become staff.
-- Make the client's account "owner" from Admin → Team after deploying.
--
-- Pincode serviceability list is removed (every Indian pincode is accepted;
-- the 6-digit pincode in the delivery address stays required).
--
-- Safe to re-run.
-- =========================================================================

-- 1. profiles.role --------------------------------------------------------
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.profiles'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end loop;
end $$;

update public.profiles set role = 'staff' where role in ('order_manager', 'content_manager');

alter table public.profiles
  add constraint profiles_role_check check (role in ('customer', 'super_admin', 'owner', 'staff'));

-- 2. admin_invites.role (invites by link are no longer used) -------------
do $$
declare c record;
begin
  if to_regclass('public.admin_invites') is null then return; end if;
  for c in
    select conname from pg_constraint
     where conrelid = 'public.admin_invites'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.admin_invites drop constraint %I', c.conname);
  end loop;
  delete from public.admin_invites where accepted_at is null;
  update public.admin_invites set role = 'staff' where role in ('order_manager', 'content_manager');
  alter table public.admin_invites
    add constraint admin_invites_role_check check (role in ('super_admin', 'owner', 'staff'));
end $$;

-- 3. helpers used by RLS policies ----------------------------------------
create or replace function public.is_admin(u uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.profiles where id = u and role in ('super_admin', 'owner', 'staff') and coalesce(is_active, true));
$$;

-- 4. pincode feature removed ---------------------------------------------
drop table if exists public.pincodes cascade;

-- 5. live dashboard: let signed-in admins receive order changes instantly --
-- (Supabase Realtime still applies RLS, so customers only ever see their own orders.)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
     ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
