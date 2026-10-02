import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";
import { sendEmail } from "@/lib/resend";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Emails everyone who pressed "Notify me" for this product, if it can be bought
 * now (active, and at least one size in stock). Each person is emailed once.
 */
export async function notifyBackInStock(admin: SupabaseClient, productId: string): Promise<number> {
  try {
    const { data: p } = await admin.from("products").select("name, slug, status").eq("id", productId).maybeSingle();
    if (!p || p.status !== "active") return 0;
    const { count } = await admin.from("product_variants").select("id", { count: "exact", head: true }).eq("product_id", productId).gt("stock_qty", 0);
    if (!count) return 0;
    const { data: waiting } = await admin.from("stock_notifications").select("id, email").eq("product_id", productId).is("notified_at", null).limit(500);
    if (!waiting?.length) return 0;
    // Mark first so a second save can't email the same people twice.
    await admin.from("stock_notifications").update({ notified_at: new Date().toISOString() }).in("id", waiting.map((w: any) => w.id));
    const url = `${SITE_URL}/product/${p.slug}`;
    for (const w of waiting) {
      await sendEmail({
        to: w.email,
        subject: `Back in stock: ${p.name}`,
        html: `<p>Good news! <b>${esc(p.name)}</b> is back in stock at Jack &amp; Jill.</p><p><a href="${url}">Shop it now</a> before it sells out again.</p>`,
      }).catch(() => null);
    }
    return waiting.length;
  } catch {
    return 0;
  }
}
