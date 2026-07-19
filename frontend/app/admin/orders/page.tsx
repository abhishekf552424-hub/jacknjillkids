import { createAdminClient } from "@/lib/supabase/admin";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; payment?: string; from?: string; to?: string }> }) {
  const sp = await searchParams;
  const admin = createAdminClient();
  let q = admin.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (sp.status) q = q.eq("status", sp.status);
  if (sp.payment) q = q.eq("payment_method", sp.payment);
  if (sp.from) q = q.gte("created_at", new Date(sp.from).toISOString());
  if (sp.to) q = q.lte("created_at", new Date(sp.to + "T23:59:59").toISOString());
  const { data } = await q;
  let rows = data ?? [];
  if (sp.q) {
    const needle = sp.q.toLowerCase();
    rows = rows.filter((o: any) => o.order_number?.toLowerCase().includes(needle) || o.shipping_address?.full_name?.toLowerCase().includes(needle) || o.shipping_address?.phone?.includes(needle) || o.shipping_address?.email?.toLowerCase().includes(needle));
  }
  return <OrdersClient rows={rows} initialFilters={sp as any} />;
}
