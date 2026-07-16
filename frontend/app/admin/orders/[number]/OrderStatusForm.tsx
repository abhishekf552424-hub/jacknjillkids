"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ORDER_STAGES } from "@/lib/utils";

const ALL = [
  ...ORDER_STAGES.map((s) => s.key),
  "cancelled",
  "return_requested",
  "return_approved",
  "refunded",
];

export default function OrderStatusForm({ orderId, orderNumber, customerEmail, currentStatus }: {
  orderId: string; orderNumber: string; customerEmail?: string; currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const save = async () => {
    setSaving(true);
    const r = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note, notify_email: customerEmail, order_number: orderNumber }),
    });
    setSaving(false);
    if (!r.ok) return toast.error("Failed");
    toast.success("Status updated");
    setNote("");
    router.refresh();
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-soft">
      <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Update status</p>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-cream border border-navy/10 rounded px-3 py-2 text-sm outline-none focus:border-gold">
        {ALL.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
      </select>
      <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note (visible to customer)" className="mt-2 w-full bg-cream border border-navy/10 rounded px-3 py-2 text-sm outline-none focus:border-gold" />
      <button disabled={saving} onClick={save} className="mt-3 w-full bg-navy text-white rounded py-2.5 text-sm font-medium disabled:opacity-60">
        {saving ? "Saving..." : "Update & notify"}
      </button>
    </div>
  );
}
