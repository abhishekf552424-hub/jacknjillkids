import { createClient } from "@supabase/supabase-js";

/**
 * Admin (service_role) client — server-only. Bypasses RLS.
 * Never import from client components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
