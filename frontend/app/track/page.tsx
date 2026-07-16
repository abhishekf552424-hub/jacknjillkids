"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !contact) return toast.error("Enter both order number and email/phone");
    setBusy(true);
    const r = await fetch(`/api/track?order=${encodeURIComponent(orderNumber)}&contact=${encodeURIComponent(contact)}`);
    setBusy(false);
    const j = await r.json();
    if (!r.ok || !j.ok) return toast.error(j.error || "Order not found");
    router.push(`/orders/${orderNumber}`);
  };

  return (
    <div className="container py-16 md:py-24 max-w-lg">
      <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Track order</p>
      <h1 className="font-display text-3xl md:text-4xl text-navy tracking-tight">Where's my order?</h1>
      <p className="mt-2 text-muted">Enter your order number and the email or phone used at checkout.</p>

      <form onSubmit={submit} className="mt-8 bg-white rounded-lg p-6 shadow-soft space-y-4" data-testid="track-form">
        <div>
          <label className="text-xs uppercase tracking-widest font-bold text-navy">Order number</label>
          <input
            data-testid="track-order"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.trim().toUpperCase())}
            placeholder="e.g. JJ100001"
            className="mt-1 w-full bg-cream border border-navy/10 rounded px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest font-bold text-navy">Email or phone</label>
          <input
            data-testid="track-contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="mt-1 w-full bg-cream border border-navy/10 rounded px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </div>
        <button disabled={busy} data-testid="track-submit" className="w-full bg-navy text-white rounded py-3 font-medium disabled:opacity-60 flex items-center justify-center gap-2">
          <Search className="w-4 h-4" /> {busy ? "Searching..." : "Track order"}
        </button>
      </form>
    </div>
  );
}
