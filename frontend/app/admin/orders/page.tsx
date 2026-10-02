import { createAdminClient } from "@/lib/supabase/admin";
import OrdersClient from "./OrdersClient";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; payment?: string; from?: string; to?: string }> }) {
  await requireAdminPage("orders");
  const sp = await searchParams;
  const admin = createAdminClient();
  let q = admin.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (sp.status) q = q.eq("status", sp.status);
  if (sp.payment) q = q.eq("payment_method", sp.payment);
  if (sp.from) q = q.gte("created_at", new Date(sp.from).toISOString());
  if (sp.to) q = q.lte("created_at", new Date(sp.to + "T23:59:59").toISOString());
  // Search the whole order history (not just the latest 200).
  const needle = (sp.q || "").replace(/[%_,()*\\:"']/g, " ").trim().slice(0, 60);
  if (needle) {
    const like = `%${needle}%`;
    q = q.or(
      [
        `order_number.ilike.${like}`,
        `guest_email.ilike.${like}`,
        `guest_phone.ilike.${like}`,
        `shipping_address->>full_name.ilike.${like}`,
        `shipping_address->>phone.ilike.${like}`,
        `shipping_address->>email.ilike.${like}`,
      ].join(","),
    );
  }
  const { data } = await q;
  const rows = data ?? [];
  return <OrdersClient rows={rows} initialFilters={sp as any} />;
}
