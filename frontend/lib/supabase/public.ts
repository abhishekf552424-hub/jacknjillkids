import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-less Supabase client for PUBLIC catalogue reads (products,
 * categories, CMS, settings readable by anon). It never touches the
 * request's cookies, so pages that only use it can be cached/ISR'd instead
 * of being rendered on every request. RLS still applies (anon role).
 * Use lib/supabase/server.ts when the signed-in user matters.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
