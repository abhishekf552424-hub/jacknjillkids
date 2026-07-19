"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CreditCard, Truck, Info, Save, Users, ArrowRight } from "lucide-react";

export default function SettingsClient({ initial }: { initial: Record<string, any> }) {
  const [rzp, setRzp] = useState({
    key_id: initial.razorpay?.key_id ?? "",
    key_secret: initial.razorpay?.key_secret ?? "",
    webhook_secret: initial.razorpay?.webhook_secret ?? "",
    enabled: initial.razorpay?.enabled ?? false,
  });
  const [shipping, setShipping] = useState({
    free_above: initial.shipping?.free_above ?? 999,
    flat_fee: initial.shipping?.flat_fee ?? 79,
    gst_percent: initial.shipping?.gst_percent ?? 5,
  });
  const [cod, setCod] = useState({ enabled: initial.cod?.enabled ?? true });
  const [contact, setContact] = useState({
    phone: initial.contact_info?.phone ?? "",
    email: initial.contact_info?.email ?? "",
    address: initial.contact_info?.address ?? "",
    hours: initial.contact_info?.hours ?? "",
  });

  const save = async (key: string, value: any) => {
    const r = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (!r.ok) return toast.error("Save failed");
    toast.success("Saved");
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gold font-bold">Configuration</p>
      <h1 className="font-display text-3xl text-navy tracking-tight">Settings</h1>

      <Link href="/admin/settings/users" className="mt-6 mb-2 flex items-center justify-between bg-white rounded-lg p-4 shadow-soft border-l-4 border-gold hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-gold" />
          <div>
            <div className="font-medium text-navy">Admin users</div>
            <div className="text-xs text-neutral-500">Invite, roles, deactivate, reset password</div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-neutral-400" />
      </Link>

      <div className="mt-4 grid gap-6">
        <div className="bg-white rounded-lg p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-gold" />
            <h2 className="font-display text-xl text-navy">Razorpay</h2>
          </div>
          <p className="text-sm text-muted mb-4">Enter keys from Razorpay Dashboard → Settings → API Keys (test mode).</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <F label="Key ID" value={rzp.key_id} onChange={(v) => setRzp({ ...rzp, key_id: v })} placeholder="rzp_test_..." testid="rzp-key-id" />
            <F label="Key Secret" value={rzp.key_secret} onChange={(v) => setRzp({ ...rzp, key_secret: v })} placeholder="••••••••••" type="password" testid="rzp-key-secret" />
            <F label="Webhook Secret" value={rzp.webhook_secret} onChange={(v) => setRzp({ ...rzp, webhook_secret: v })} placeholder="••••••••••" type="password" testid="rzp-webhook-secret" />
            <label className="flex items-center gap-2 text-sm text-navy self-end pb-2"><input type="checkbox" checked={rzp.enabled} onChange={(e) => setRzp({ ...rzp, enabled: e.target.checked })} /> Enable Razorpay</label>
          </div>
          <p className="text-xs text-muted mt-2">Webhook URL: <code>{process.env.NEXT_PUBLIC_SITE_URL || "https://your-site"}/api/razorpay/webhook</code></p>
          <button onClick={() => save("razorpay", rzp)} data-testid="save-rzp-btn" className="mt-4 bg-navy text-white rounded px-4 py-2 text-sm flex items-center gap-2"><Save className="w-4 h-4" /> Save Razorpay settings</button>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-gold" />
            <h2 className="font-display text-xl text-navy">Shipping & Tax</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <F label="Free shipping above (₹)" value={String(shipping.free_above)} onChange={(v) => setShipping({ ...shipping, free_above: Number(v) })} type="number" />
            <F label="Flat shipping fee (₹)" value={String(shipping.flat_fee)} onChange={(v) => setShipping({ ...shipping, flat_fee: Number(v) })} type="number" />
            <F label="GST %" value={String(shipping.gst_percent)} onChange={(v) => setShipping({ ...shipping, gst_percent: Number(v) })} type="number" />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-navy"><input type="checkbox" checked={cod.enabled} onChange={(e) => setCod({ enabled: e.target.checked })} /> Enable Cash on Delivery</label>
          <div className="mt-4 flex gap-2">
            <button onClick={() => save("shipping", shipping)} className="bg-navy text-white rounded px-4 py-2 text-sm">Save shipping</button>
            <button onClick={() => save("cod", cod)} className="border border-navy/10 text-navy rounded px-4 py-2 text-sm">Save COD</button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-gold" />
            <h2 className="font-display text-xl text-navy">Contact info</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <F label="Phone" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} />
            <F label="Email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} />
            <div className="sm:col-span-2"><F label="Address" value={contact.address} onChange={(v) => setContact({ ...contact, address: v })} /></div>
            <F label="Business hours" value={contact.hours} onChange={(v) => setContact({ ...contact, hours: v })} />
          </div>
          <button onClick={() => save("contact_info", contact)} className="mt-4 bg-navy text-white rounded px-4 py-2 text-sm">Save contact info</button>
        </div>
      </div>
    </div>
  );
}

function F(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; testid?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-navy font-bold">{props.label}</span>
      <input type={props.type || "text"} value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} data-testid={props.testid} className="mt-1 w-full bg-cream border border-navy/10 rounded px-3 py-2 text-sm outline-none focus:border-gold" />
    </label>
  );
}
