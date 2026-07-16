import { NextResponse } from "next/server";
import { getShippingSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { subtotal, pincode } = await req.json();
  const s = await getShippingSettings();
  let shipping = 0;
  if (subtotal < s.free_above) shipping = s.flat_fee;
  if (pincode) {
    const admin = createAdminClient();
    const { data } = await admin.from("pincodes").select("is_serviceable").eq("pincode", pincode).maybeSingle();
    if (data && !data.is_serviceable) shipping = 0;
  }
  const totalPreTax = subtotal + shipping;
  const tax = Math.round(totalPreTax * (s.gst_percent / 100));
  const total = totalPreTax + tax;
  return NextResponse.json({ shipping, tax, total });
}
