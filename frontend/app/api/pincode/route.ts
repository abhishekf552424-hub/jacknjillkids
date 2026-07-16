import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim();
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ serviceable: false, error: "Invalid pincode" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data } = await admin.from("pincodes").select("*").eq("pincode", code).maybeSingle();
  if (!data) return NextResponse.json({ serviceable: false });
  return NextResponse.json({
    serviceable: data.is_serviceable,
    city: data.city,
    state: data.state,
    cod_available: data.cod_available,
    est_delivery_days: data.est_delivery_days,
  });
}
