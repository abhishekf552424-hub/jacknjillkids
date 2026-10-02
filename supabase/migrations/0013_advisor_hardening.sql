-- =========================================================================
-- 0013 — Fixes from the Supabase security advisor (safe to re-run)
--  * admin_otp_recent view ran with its creator's rights → now uses the
--    caller's rights, and only the server (service role) can read it.
--  * Trigger-only functions can no longer be called through /rest/v1/rpc.
--  * is_admin / is_super_admin stay callable: every RLS policy uses them,
--    and they only answer true/false for a given user id.
-- =========================================================================
alter view if exists public.admin_otp_recent set (security_invoker = true);
revoke all on public.admin_otp_recent from anon, authenticated;
grant select on public.admin_otp_recent to service_role;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_privileged_columns() from public, anon, authenticated;
