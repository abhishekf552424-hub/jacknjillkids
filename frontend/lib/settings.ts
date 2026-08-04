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

export type BrandSettings = {
  logo_url: string;
  store_name: string;
  gstin: string;
  billing_address: string;
  billing_state: string;
  // Phase Q — three breakpoint-specific logo sizes (in px). Legacy `logo_size`
  // is kept as a fallback for backward compat with old settings rows.
  logo_size: number;         // legacy / fallback
  logo_size_mobile: number;  // mobile <sm (default 36)
  logo_size_tablet: number;  // sm-lg (default 44)
  logo_size_desktop: number; // lg+ (default 52)
  logo_align: "left" | "center"; // logo horizontal position ONLY — never affects nav visibility
};

let brandCache: { v: BrandSettings | null; at: number } = { v: null, at: 0 };
export async function getBrandSettings(): Promise<BrandSettings> {
  if (brandCache.v && Date.now() - brandCache.at < 60_000) return brandCache.v;
  const admin = createAdminClient();
  const { data } = await admin.from("settings").select("value").eq("key", "brand").maybeSingle();
  const v = (data?.value ?? {}) as Partial<BrandSettings>;
  const clampInt = (n: unknown, lo: number, hi: number, fallback: number) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return fallback;
    return Math.round(Math.max(lo, Math.min(hi, x)));
  };
  const legacy = clampInt(v.logo_size, 24, 80, 40);
  const brand: BrandSettings = {
    logo_url: v.logo_url || "",
    store_name: v.store_name || "Jack & Jill",
    gstin: v.gstin || "",
    billing_address: v.billing_address || "",
    billing_state: v.billing_state || "Maharashtra",
    logo_size: legacy,
    logo_size_mobile: clampInt(v.logo_size_mobile, 28, 56, Math.min(Math.max(legacy - 4, 28), 48)),
    logo_size_tablet: clampInt(v.logo_size_tablet, 32, 64, Math.min(Math.max(legacy, 32), 56)),
    logo_size_desktop: clampInt(v.logo_size_desktop, 36, 80, Math.min(Math.max(legacy + 4, 36), 64)),
    logo_align: v.logo_align === "center" ? "center" : "left",
  };
  brandCache = { v: brand, at: Date.now() };
  return brand;
}

export function clearBrandCache() {
  brandCache = { v: null, at: 0 };
}

export async function getTrackingSettings() {
  const admin = createAdminClient();
  const { data } = await admin.from("settings").select("value").eq("key", "tracking").maybeSingle();
  return (data?.value ?? { meta_pixel_id: "", ga4_id: "" }) as { meta_pixel_id: string; ga4_id: string };
}

export async function getReturnsSettings() {
  const admin = createAdminClient();
  const { data } = await admin.from("settings").select("value").eq("key", "returns").maybeSingle();
  return (data?.value ?? { exchange_window_days: 7 }) as { exchange_window_days: number };
}

export async function getPromoPopup() {
  const admin = createAdminClient();
  const { data } = await admin.from("settings").select("value").eq("key", "promo_popup").maybeSingle();
  return (data?.value ?? null) as null | {
    enabled: boolean; image_url: string; link: string; headline: string; subtext: string;
    frequency: "session" | "always"; delay_seconds: number; start_date?: string; end_date?: string;
  };
}
