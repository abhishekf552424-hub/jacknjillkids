import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const order = (url.searchParams.get("order") || "").trim().toUpperCase();
  const contact = (url.searchParams.get("contact") || "").trim().toLowerCase();
  if (!order || !contact) return NextResponse.json({ ok: false, error: "Missing" }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin.from("orders").select("id, order_number, shipping_address, guest_email, guest_phone").eq("order_number", order).maybeSingle();
  if (!data) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });

  const email = (data.shipping_address?.email || data.guest_email || "").toLowerCase();
  const phone = (data.shipping_address?.phone || data.guest_phone || "").replace(/\D/g, "");
  const clean = contact.replace(/\D/g, "");
  if (contact !== email && (!clean || clean !== phone)) {
    return NextResponse.json({ ok: false, error: "Order and contact don't match" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, order_number: data.order_number });
}
