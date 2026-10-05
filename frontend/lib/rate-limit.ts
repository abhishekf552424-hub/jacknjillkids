import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Shared rate limit (stored in the database, so it holds across server
 * restarts and several server copies). Returns true when the action is allowed.
 * If the limiter itself fails we allow the request rather than block shoppers.
 */
export async function allow(key: string, max: number, windowSeconds: number, admin?: SupabaseClient): Promise<boolean> {
  try {
    const db = admin ?? createAdminClient();
    const { data, error } = await db.rpc("hit_rate_limit", { p_key: key.slice(0, 200), p_max: max, p_window_seconds: windowSeconds });
    if (error) {
      console.error("[rate-limit]", error.message);
      return true;
    }
    return data !== false;
  } catch {
    return true;
  }
}

/** Best-effort client IP behind Hostinger's proxy. */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0] || "unknown").trim().slice(0, 64);
}
