import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in", status: 401 };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!p || !["super_admin", "order_manager", "content_manager"].includes(p.role)) return { error: "Forbidden", status: 403 };
  return { user, role: p.role };
}

export async function GET() {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });

  const admin = createAdminClient();
  const isOrderScoped = g.role === "super_admin" || g.role === "order_manager";
  const isContentScoped = g.role === "super_admin" || g.role === "content_manager";

  const notifications: { id: string; type: string; message: string; href: string; created_at: string }[] = [];

  const tasks: Promise<any>[] = [];

  if (isOrderScoped) {
    tasks.push(
      Promise.resolve(
        admin
          .from("orders")
          .select("id, order_number, created_at")
          .order("created_at", { ascending: false })
          .limit(5)
      ).then(({ data }) => {
        for (const o of data ?? []) {
          notifications.push({
            id: `order-${o.id}`,
            type: "order",
            message: `New order ${o.order_number}`,
            href: `/admin/orders/${o.order_number}`,
            created_at: o.created_at,
          });
        }
      })
    );
    tasks.push(
      Promise.resolve(
        admin
          .from("support_tickets")
          .select("id, subject, created_at")
          .order("created_at", { ascending: false })
          .limit(5)
      ).then(({ data }) => {
        for (const t of data ?? []) {
          notifications.push({
            id: `ticket-${t.id}`,
            type: "support",
            message: `Support: ${t.subject || "New enquiry"}`,
            href: `/admin/support`,
            created_at: t.created_at,
          });
        }
      })
    );
  }

  if (isContentScoped) {
    tasks.push(
      Promise.resolve(
        admin
          .from("product_variants")
          .select("id, sku, stock_qty, created_at, product:products(name)")
          .lte("stock_qty", 5)
          .order("stock_qty", { ascending: true })
          .limit(5)
      ).then(({ data }) => {
        for (const v of data ?? []) {
          const productName = Array.isArray(v.product) ? v.product[0]?.name : (v.product as any)?.name;
          notifications.push({
            id: `stock-${v.id}`,
            type: "stock",
            message: `Low stock: ${productName ?? v.sku} (${v.stock_qty} left)`,
            href: `/admin/products`,
            created_at: v.created_at ?? new Date().toISOString(),
          });
        }
      })
    );
    tasks.push(
      Promise.resolve(
        admin
          .from("reviews")
          .select("id, created_at")
          .eq("is_approved", false)
          .order("created_at", { ascending: false })
          .limit(5)
      ).then(({ data }) => {
        for (const r of data ?? []) {
          notifications.push({
            id: `review-${r.id}`,
            type: "review",
            message: `New review pending approval`,
            href: `/admin/reviews`,
            created_at: r.created_at,
          });
        }
      })
    );
  }

  await Promise.all(tasks);
  notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ ok: true, notifications: notifications.slice(0, 15) });
}
