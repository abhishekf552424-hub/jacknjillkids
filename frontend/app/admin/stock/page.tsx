import { requireAdminPage } from "@/lib/admin-auth";
import StockClient from "./StockClient";

export const dynamic = "force-dynamic";

export default async function AdminStock({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const { role } = await requireAdminPage("stock");
  const sp = await searchParams;
  const filter = sp.filter === "low" || sp.filter === "out" ? sp.filter : "";
  return <StockClient initialFilter={filter} initialQuery={sp.q ?? ""} canEditProducts={role !== "staff"} />;
}
