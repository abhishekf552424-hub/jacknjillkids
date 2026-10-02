"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, KeyRound, Power, UserMinus, Loader2, ShieldCheck, Check, X } from "lucide-react";
import { AdminPageHeader, AdminCard, StatusPill } from "@/components/admin/ui";
import { ROLE_HELP, ROLE_LABEL, type AdminRole } from "@/lib/admin-roles";

type Member = { id: string; email: string; full_name: string | null; role: AdminRole; is_active: boolean; created_at: string };

const MATRIX: { area: string; owner: boolean; staff: boolean }[] = [
  { area: "See and update orders, print invoices", owner: true, staff: true },
  { area: "Returns, exchanges and customer queries", owner: true, staff: true },
  { area: "Update stock counts", owner: true, staff: true },
  { area: "Sales totals and reports", owner: true, staff: false },
  { area: "Add / edit products, photos and prices", owner: true, staff: false },
  { area: "Coupons, homepage banners, reviews, pages", owner: true, staff: false },
  { area: "Customer list", owner: true, staff: false },
  { area: "Settings and team", owner: true, staff: false },
];

export default function TeamClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [me, setMe] = useState<{ id: string; role: AdminRole } | null>(null);
  const [assignable, setAssignable] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", role: "staff" as AdminRole, password: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/users", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not load the team");
      setMembers(j.admins);
      setMe(j.me);
      setAssignable(j.assignable);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const call = async (url: string, init: RequestInit, ok: string) => {
    const r = await fetch(url, { ...init, headers: { "content-type": "application/json" } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      toast.error(j.error || "Something went wrong");
      return false;
    }
    toast.success(ok);
    return true;
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const j = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) return toast.error(j.error || "Could not add this person");
    toast.success(j.existing ? "Added. They already had an account, so they keep their own password." : "Added. Share the password with them privately.");
    setShowNew(false);
    setForm({ email: "", full_name: "", role: "staff", password: "" });
    load();
  };

  const makePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const arr = new Uint32Array(14);
    crypto.getRandomValues(arr);
    setForm((f) => ({ ...f, password: Array.from(arr, (x) => chars[x % chars.length]).join("") }));
  };

  const manageable = (m: Member) => !!me && m.id !== me.id && assignable.includes(m.role);

  return (
    <div className="max-w-5xl">
      <AdminPageHeader
        eyebrow="Shop setup"
        title="Team & access"
        subtitle="Give each person their own login. Staff can handle orders and stock but can't see sales totals or change prices."
        action={
          assignable.length > 0 && (
            <button onClick={() => setShowNew((v) => !v)} className="inline-flex items-center gap-2 rounded-lg bg-action hover:bg-action-hover text-white px-4 py-2.5 text-sm font-semibold">
              <UserPlus className="w-4 h-4" /> Add a person
            </button>
          )
        }
      />

      {showNew && (
        <AdminCard className="p-4 sm:p-5 mb-5">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" required type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-semibold text-navy mb-2">What can they do?</legend>
              <div className="grid sm:grid-cols-3 gap-2">
                {assignable.map((r) => (
                  <label key={r} className={`rounded-xl border p-3 cursor-pointer ${form.role === r ? "border-navy bg-sky/60" : "border-line hover:bg-cream"}`}>
                    <input type="radio" name="role" className="sr-only" checked={form.role === r} onChange={() => setForm({ ...form, role: r })} />
                    <span className="flex items-center gap-2 font-semibold text-navy">
                      <span className={`w-4 h-4 rounded-full border-2 ${form.role === r ? "border-navy bg-navy shadow-[inset_0_0_0_2px_white]" : "border-line-strong"}`} />
                      {ROLE_LABEL[r]}
                    </span>
                    <span className="block text-xs text-muted mt-1">{ROLE_HELP[r]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="sm:col-span-2">
              <Field
                label="Password for their first login (10+ characters)"
                required
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                after={
                  <button type="button" onClick={makePassword} className="shrink-0 rounded-lg border border-line px-3 text-sm font-semibold text-navy hover:bg-cream">
                    Make one
                  </button>
                }
              />
              <p className="text-xs text-muted mt-1">Send it to them on WhatsApp or by phone. Every login also asks for a code sent to their email.</p>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-navy text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add to team
              </button>
              <button type="button" onClick={() => setShowNew(false)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-navy hover:bg-cream">
                Cancel
              </button>
            </div>
          </form>
        </AdminCard>
      )}

      <AdminCard className="divide-y divide-line">
        {loading ? (
          <p className="p-8 text-center text-muted">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
            Loading…
          </p>
        ) : (
          members.map((m) => (
            <div key={m.id} className="p-4 flex flex-wrap items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-butter text-navy font-bold flex items-center justify-center uppercase shrink-0">{(m.full_name || m.email).slice(0, 1)}</span>
              <div className="min-w-0 flex-1 basis-48">
                <p className="font-semibold text-navy truncate">
                  {m.full_name || m.email} {me?.id === m.id && <span className="text-xs font-normal text-muted">(you)</span>}
                </p>
                <p className="text-sm text-muted truncate">{m.email}</p>
              </div>
              {manageable(m) ? (
                <select
                  value={m.role}
                  onChange={async (e) => (await call(`/api/admin/users/${m.id}`, { method: "PUT", body: JSON.stringify({ role: e.target.value }) }, "Role changed")) && load()}
                  className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-navy"
                  aria-label={`Role for ${m.email}`}
                >
                  {assignable.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm font-semibold text-navy">{ROLE_LABEL[m.role]}</span>
              )}
              <StatusPill label={m.is_active ? "Can log in" : "Switched off"} tone={m.is_active ? "success" : "neutral"} />
              {manageable(m) && (
                <div className="flex gap-1 w-full sm:w-auto justify-end">
                  <IconBtn
                    label="Email a password reset link"
                    icon={KeyRound}
                    onClick={() => call(`/api/admin/users/${m.id}`, { method: "POST" }, "Reset link emailed")}
                  />
                  <IconBtn
                    label={m.is_active ? "Switch off login" : "Switch on login"}
                    icon={Power}
                    onClick={async () => (await call(`/api/admin/users/${m.id}`, { method: "PUT", body: JSON.stringify({ is_active: !m.is_active }) }, m.is_active ? "Login switched off" : "Login switched on")) && load()}
                  />
                  <IconBtn
                    label="Remove from team"
                    icon={UserMinus}
                    danger
                    onClick={async () => {
                      if (!confirm(`Remove ${m.email} from the team? They will no longer be able to open the admin panel.`)) return;
                      if (await call(`/api/admin/users/${m.id}`, { method: "DELETE" }, "Removed from team")) load();
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </AdminCard>

      <AdminCard className="mt-6 p-4 sm:p-5">
        <h2 className="font-display text-lg text-navy flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-doodle" /> Who can do what
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-2 pr-3 font-semibold">Task</th>
                <th className="py-2 px-3 font-semibold text-center">Owner</th>
                <th className="py-2 px-3 font-semibold text-center">Staff</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((r) => (
                <tr key={r.area} className="border-t border-line">
                  <td className="py-2 pr-3 text-ink">{r.area}</td>
                  <td className="py-2 px-3 text-center">{r.owner ? <Check className="w-4 h-4 text-success inline" aria-label="Yes" /> : <X className="w-4 h-4 text-muted inline" aria-label="No" />}</td>
                  <td className="py-2 px-3 text-center">{r.staff ? <Check className="w-4 h-4 text-success inline" aria-label="Yes" /> : <X className="w-4 h-4 text-muted inline" aria-label="No" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-3">The developer account can also change payment keys and tracking codes. Nobody can change their own role.</p>
      </AdminCard>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, after }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; after?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy">{label}</span>
      <span className="mt-1 flex gap-2">
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-line bg-cream/50 px-3 py-2.5 text-[15px] outline-none focus:border-doodle focus:bg-white"
        />
        {after}
      </span>
    </label>
  );
}

function IconBtn({ label, icon: Icon, onClick, danger }: { label: string; icon: any; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className={`w-9 h-9 rounded-lg border border-line flex items-center justify-center hover:bg-cream ${danger ? "text-error" : "text-navy"}`}>
      <Icon className="w-4 h-4" />
    </button>
  );
}
