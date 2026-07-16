import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCustomers() {
  const admin = createAdminClient();
  const { data: profiles } = await admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
  const ids = (profiles ?? []).map((p: any) => p.id);
  const { data: orders } = ids.length ? await admin.from("orders").select("user_id, total").in("user_id", ids) : { data: [] };
  const spendByUser = new Map<string, number>();
  const countByUser = new Map<string, number>();
  (orders ?? []).forEach((o: any) => {
    spendByUser.set(o.user_id, (spendByUser.get(o.user_id) ?? 0) + Number(o.total));
    countByUser.set(o.user_id, (countByUser.get(o.user_id) ?? 0) + 1);
  });

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gold font-bold">People</p>
      <h1 className="font-display text-3xl text-navy tracking-tight">Customers</h1>

      <div className="mt-6 bg-white rounded-lg shadow-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Orders</th>
              <th className="text-left px-4 py-3">Spend</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p: any) => (
              <tr key={p.id} className="border-t border-navy/5">
                <td className="px-4 py-3 text-navy">{p.full_name || "—"}</td>
                <td className="px-4 py-3 text-muted">{p.email}</td>
                <td className="px-4 py-3 text-muted">{p.phone || "—"}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-navy/5 text-navy">{p.role}</span></td>
                <td className="px-4 py-3 text-navy">{countByUser.get(p.id) ?? 0}</td>
                <td className="px-4 py-3 text-navy font-medium">{formatINR(spendByUser.get(p.id) ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
