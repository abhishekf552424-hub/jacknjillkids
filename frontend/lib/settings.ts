import { createAdminClient } from "@/lib/supabase/admin";

type RazorpayCfg = {
  key_id: string;
  key_secret: string;
  webhook_secret: string;
  enabled: boolean;
};

let cache: { cfg: RazorpayCfg | null; at: number } = { cfg: null, at: 0 };

export async function getRazorpayConfig(): Promise<RazorpayCfg> {
  // 60s cache to reduce DB hits
  if (cache.cfg && Date.now() - cache.at < 60_000) return cache.cfg;

  const admin = createAdminClient();
  const { data } = await admin.from("settings").select("value").eq("key", "razorpay").maybeSingle();
  const dbCfg = (data?.value ?? {}) as Partial<RazorpayCfg>;

  const cfg: RazorpayCfg = {
    key_id: dbCfg.key_id || process.env.RAZORPAY_KEY_ID || "",
    key_secret: dbCfg.key_secret || process.env.RAZORPAY_KEY_SECRET || "",
    webhook_secret: dbCfg.webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET || "",
    enabled: dbCfg.enabled ?? Boolean(dbCfg.key_id || process.env.RAZORPAY_KEY_ID),
  };
  cache = { cfg, at: Date.now() };
  return cfg;
}

export async function getShippingSettings() {
  const admin = createAdminClient();
  const { data } = await admin.from("settings").select("value").eq("key", "shipping").maybeSingle();
  return (data?.value ?? { free_above: 999, flat_fee: 79, gst_percent: 5 }) as {
    free_above: number;
    flat_fee: number;
    gst_percent: number;
  };
}

export function clearRazorpayCache() {
  cache = { cfg: null, at: 0 };
}
