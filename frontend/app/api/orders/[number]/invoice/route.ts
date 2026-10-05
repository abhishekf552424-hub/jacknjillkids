import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidOrderAccessToken } from "@/lib/order-access";
import { getBrandSettings, getShippingSettings } from "@/lib/settings";
import { checkAdmin } from "@/lib/admin-auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fmt(n: number) { return "Rs. " + (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 }); }

export async function GET(req: Request, { params }: { params: Promise<{ number: string }> }) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  const { number } = await params;
  const admin = createAdminClient();

  const { data: order } = await admin.from("orders").select("*, items:order_items(*)").eq("order_number", number).maybeSingle();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Allowed: the customer (their login or the private order link), or an admin
  // who has passed the 2-step login and may see orders.
  let isAdmin = false;
  let allowed = isValidOrderAccessToken(number, new URL(req.url).searchParams.get("t")) || (!!user && order.user_id === user.id);
  if (!allowed && user) {
    isAdmin = (await checkAdmin("orders")).ok;
    allowed = isAdmin;
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // A tax invoice exists only for paid / cash-on-delivery orders that weren't cancelled.
  const billable = (order.payment_status === "paid" || order.payment_status === "cod") && order.status !== "cancelled";
  if (!billable && !isAdmin) return NextResponse.json({ error: "The invoice is available once the order is confirmed." }, { status: 409 });

  const brand = await getBrandSettings();
  const shipping = await getShippingSettings();

  // Fetch products for hsn codes
  const productIds = Array.from(new Set((order.items ?? []).map((it: any) => it.product_id).filter(Boolean)));
  const { data: prods } = await admin.from("products").select("id, hsn_code").in("id", productIds as string[]);
  const hsnById = new Map((prods ?? []).map((p: any) => [p.id, p.hsn_code as string | null]));

  const sameState = String(brand.billing_state || "").toLowerCase() === String(order.shipping_address?.state || "").toLowerCase();
  const gstPct = Number(shipping?.gst_percent || 5);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();

  const draw = (text: string, x: number, y: number, opts: { size?: number; font?: any; color?: any } = {}) => {
    page.drawText(text, { x, y, size: opts.size ?? 10, font: opts.font ?? font, color: opts.color ?? rgb(0.11, 0.16, 0.29) });
  };

  // Header
  draw(brand.store_name || "Jack & Jill", 40, 800, { size: 20, font: bold });
  draw("Tax Invoice", width - 130, 800, { size: 16, font: bold, color: rgb(0.79, 0.6, 0.18) });
  draw(brand.billing_address || "Kolhapur, Maharashtra, India", 40, 780, { size: 9, color: rgb(0.4, 0.4, 0.4) });
  draw(`GSTIN: ${brand.gstin || "-"}`, 40, 766, { size: 9, color: rgb(0.4, 0.4, 0.4) });

  // Order + customer
  draw(`Invoice #: ${order.order_number}`, 40, 730, { size: 10, font: bold });
  draw(`Date: ${new Date(order.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`, 40, 715, { size: 9 });
  draw(`Payment: ${String(order.payment_method).toUpperCase()} (${order.payment_status})`, 40, 700, { size: 9 });

  draw("Bill to:", 330, 730, { size: 10, font: bold });
  const addr = order.shipping_address || {};
  const lines = [addr.full_name, addr.line1, addr.line2, `${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}`, `${addr.phone || ""} | ${addr.email || ""}`].filter(Boolean);
  lines.forEach((l: string, i: number) => draw(l, 330, 715 - i * 12, { size: 9 }));

  // Items header
  let y = 640;
  page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 22, color: rgb(1, 0.976, 0.949) });
  draw("Item", 46, y + 4, { size: 10, font: bold });
  draw("HSN", 300, y + 4, { size: 10, font: bold });
  draw("Qty", 350, y + 4, { size: 10, font: bold });
  draw("Price", 400, y + 4, { size: 10, font: bold });
  draw("GST incl.", 460, y + 4, { size: 10, font: bold });
  draw("Total", 510, y + 4, { size: 10, font: bold });
  y -= 22;

  const r = gstPct / 100;
  let gross = 0;
  for (const it of order.items ?? []) {
    const line = Number(it.price_at_purchase) * Number(it.quantity);
    gross += line;
    const taxable = line / (1 + r);
    const name = String(it.product_name || "").slice(0, 40);
    draw(name, 46, y, { size: 9 });
    draw(String(hsnById.get(it.product_id) || "-"), 300, y, { size: 9 });
    draw(String(it.quantity), 350, y, { size: 9 });
    draw(fmt(Number(it.price_at_purchase)), 400, y, { size: 9 });
    draw(fmt(line - taxable), 460, y, { size: 9 });
    draw(fmt(line), 510, y, { size: 9 });
    y -= 16;
    if (it.variant_label) { draw(String(it.variant_label).slice(0, 40), 46, y, { size: 8, color: rgb(0.5, 0.5, 0.5) }); y -= 12; }
  }

  // Totals — built from what was actually charged, so the invoice always adds up.
  const discount = Number(order.discount || 0);
  const shippingFee = Number(order.shipping_fee || 0);
  const total = Number(order.total || 0);
  const inclusive = Math.abs(total - (gross - discount + shippingFee)) < 1; // prices include GST
  const taxableValue = inclusive ? total / (1 + r) : total - Number(order.tax || 0);
  const gst = total - taxableValue;
  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, color: rgb(0.9, 0.9, 0.9) });
  y -= 14;
  draw(inclusive ? "Items (incl. GST)" : "Items", 380, y, { size: 9 }); draw(fmt(gross), 510, y, { size: 9 }); y -= 14;
  if (discount > 0) { draw("Discount", 380, y, { size: 9 }); draw("- " + fmt(discount), 510, y, { size: 9, color: rgb(0.1, 0.5, 0.1) }); y -= 14; }
  draw("Shipping", 380, y, { size: 9 }); draw(fmt(shippingFee), 510, y, { size: 9 }); y -= 14;
  draw("Taxable value", 380, y, { size: 9 }); draw(fmt(Math.round(taxableValue * 100) / 100), 510, y, { size: 9 }); y -= 14;
  if (sameState) {
    draw(`CGST (${gstPct / 2}%)`, 380, y, { size: 9 }); draw(fmt(Math.round((gst / 2) * 100) / 100), 510, y, { size: 9 }); y -= 14;
    draw(`SGST (${gstPct / 2}%)`, 380, y, { size: 9 }); draw(fmt(Math.round((gst / 2) * 100) / 100), 510, y, { size: 9 }); y -= 14;
  } else {
    draw(`IGST (${gstPct}%)`, 380, y, { size: 9 }); draw(fmt(Math.round(gst * 100) / 100), 510, y, { size: 9 }); y -= 14;
  }
  page.drawLine({ start: { x: 380, y: y + 4 }, end: { x: width - 40, y: y + 4 }, color: rgb(0.9, 0.9, 0.9) });
  draw("Grand Total", 380, y - 10, { size: 12, font: bold });
  draw(fmt(total), 510, y - 10, { size: 12, font: bold });

  draw("Thank you for shopping with us.", 40, 60, { size: 10, color: rgb(0.5, 0.5, 0.5) });
  draw("This is a computer-generated invoice.", 40, 46, { size: 8, color: rgb(0.6, 0.6, 0.6) });

  const bytes = await pdf.save();
  const buf = Buffer.from(bytes);
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="invoice-${order.order_number}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
