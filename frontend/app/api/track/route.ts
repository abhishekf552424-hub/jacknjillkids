import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { makeOrderAccessToken } from "@/lib/order-access";
import { allow, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// One message for "no such order" and "wrong phone/email", so the form can't
// be used to find out which order numbers exist.
const NOT_FOUND = { ok: false, error: "We couldn't find an order with these details. Check the order number and the phone or email used." };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const order = (url.searchParams.get("order") || "").trim().toUpperCase().slice(0, 30);
  const contact = (url.searchParams.get("contact") || "").trim().toLowerCase().slice(0, 120);
  if (!order || !contact) return NextResponse.json({ ok: false, error: "Enter your order number and phone or email." }, { status: 400 });

  const admin = createAdminClient();
  const ip = clientIp(req);
  if (!(await allow(`track:ip:${ip}`, 20, 600, admin)) || !(await allow(`track:order:${order}`, 10, 3600, admin))) {
    return NextResponse.json({ ok: false, error: "Too many tries. Please wait a few minutes." }, { status: 429 });
  }

  const { data } = await admin.from("orders").select("id, order_number, shipping_address, guest_email, guest_phone").eq("order_number", order).maybeSingle();
  if (!data) return NextResponse.json(NOT_FOUND, { status: 404 });

  const email = (data.shipping_address?.email || data.guest_email || "").toLowerCase();
  const phone = (data.shipping_address?.phone || data.guest_phone || "").replace(/\D/g, "").slice(-10);
  const clean = contact.replace(/\D/g, "").slice(-10);
  if (contact !== email && (clean.length !== 10 || clean !== phone)) {
    return NextResponse.json(NOT_FOUND, { status: 404 });
  }
  // Contact matched — hand back the access token so guests can open their order page.
  return NextResponse.json({ ok: true, order_number: data.order_number, access_token: makeOrderAccessToken(data.order_number) }, { headers: { "cache-control": "private, no-store" } });
}
