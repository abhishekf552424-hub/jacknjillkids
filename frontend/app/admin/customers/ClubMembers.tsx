"use client";

import { useState } from "react";
import { Copy, Users } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/ui";

/** WhatsApp numbers from the homepage "Join the club" form. */
export default function ClubMembers({ rows, total }: { rows: { phone: string; created_at: string }[]; total: number }) {
  const [open, setOpen] = useState(false);
  const copyAll = async () => {
    const text = rows.map((r) => `+91${r.phone}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${rows.length} numbers copied`);
    } catch {
      toast.error("Could not copy. Select the list and copy it.");
    }
  };
  return (
    <AdminCard className="mt-6 p-4 md:p-5" >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-butter flex items-center justify-center"><Users className="w-5 h-5 text-navy" /></span>
          <div>
            <h2 className="font-display text-lg text-navy">Club members</h2>
            <p className="text-sm text-muted">{total} WhatsApp number{total === 1 ? "" : "s"} from the homepage “Join the club” form. All agreed to receive offers.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {rows.length > 0 && (
            <button onClick={copyAll} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-navy hover:bg-cream">
              <Copy className="w-4 h-4" /> Copy numbers
            </button>
          )}
          <button onClick={() => setOpen((v) => !v)} className="rounded-lg bg-navy text-white px-3 py-2 text-sm font-semibold">{open ? "Hide list" : "Show list"}</button>
        </div>
      </div>
      {open && (
        <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {rows.map((r) => (
            <li key={r.phone} className="flex justify-between gap-2 rounded-lg bg-cream px-3 py-2">
              <span className="font-semibold text-navy tabular-nums">+91 {r.phone.slice(0, 5)} {r.phone.slice(5)}</span>
              <span className="text-muted">{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
            </li>
          ))}
          {rows.length === 0 && <li className="text-muted">No sign-ups yet.</li>}
        </ul>
      )}
    </AdminCard>
  );
}
