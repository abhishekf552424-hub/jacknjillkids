"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Shield, Ban, KeyRound, Mail, Trash2 } from "lucide-react";

type Admin = { id: string; email: string; full_name: string | null; role: string; is_active: boolean; created_at: string };
type Invite = { id: string; email: string; role: string; expires_at: string; created_at: string };

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [nEmail, setNEmail] = useState("");
  const [nName, setNName] = useState("");
  const [nRole, setNRole] = useState("order_manager");
  const [nPwd, setNPwd] = useState("");

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/users");
    const j = await r.json();
    setAdmins(j.admins || []);
    setInvites(j.invites || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: nEmail, role: nRole, full_name: nName, password: nPwd || undefined }),
    });
    const j = await r.json();
    if (!r.ok) return toast.error(j.error || "Failed");
    toast.success(nPwd ? "Admin created & notified" : "Invite sent");
    setShowNew(false); setNEmail(""); setNName(""); setNRole("order_manager"); setNPwd("");
    load();
  };

  const updateRole = async (id: string, role: string) => {
    const r = await fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ role }) });
    if (!r.ok) return toast.error("Failed");
    toast.success("Role updated");
    load();
  };
  const toggleActive = async (id: string, is_active: boolean) => {
    const r = await fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ is_active }) });
    if (!r.ok) return toast.error("Failed");
    toast.success(is_active ? "Reactivated" : "Deactivated");
    load();
  };
  const resetPwd = async (id: string) => {
    const r = await fetch(`/api/admin/users/${id}`, { method: "POST" });
    if (!r.ok) return toast.error("Failed");
    toast.success("Reset link emailed");
  };
  const remove = async (id: string) => {
    if (!confirm("Demote this admin to customer? They lose all admin access.")) return;
    const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!r.ok) return toast.error("Failed");
    toast.success("Removed");
    load();
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-navy">Admin users</h1>
          <p className="text-sm text-neutral-500 mt-1">Invite teammates, assign roles, and manage access.</p>
        </div>
        <button onClick={() => setShowNew((v) => !v)} className="bg-navy text-white rounded-lg px-4 py-2 text-sm flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> New admin
        </button>
      </div>

      {showNew && (
        <form onSubmit={create} className="bg-white border border-neutral-200 rounded-xl p-5 mb-6 grid gap-3 md:grid-cols-2">
          <label className="text-sm md:col-span-2">Email<input required type="email" value={nEmail} onChange={(e) => setNEmail(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" /></label>
          <label className="text-sm">Full name<input value={nName} onChange={(e) => setNName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" /></label>
          <label className="text-sm">Role<select value={nRole} onChange={(e) => setNRole(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 bg-white">
            <option value="super_admin">Super admin</option>
            <option value="order_manager">Order manager</option>
            <option value="content_manager">Content manager</option>
          </select></label>
          <label className="text-sm md:col-span-2">Password <span className="text-neutral-400">(leave blank to send an invite link instead)</span><input type="text" value={nPwd} onChange={(e) => setNPwd(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="e.g. Temp!Pass123" /></label>
          <div className="md:col-span-2 flex gap-2">
            <button className="bg-navy text-white rounded px-4 py-2 text-sm">{nPwd ? "Create admin" : "Send invite"}</button>
            <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-widest text-neutral-500">
            <tr>
              <th className="text-left px-4 py-3">Admin</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">Loading…</td></tr>
            ) : admins.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">No admins yet</td></tr>
            ) : admins.map((a) => (
              <tr key={a.id} className="border-t border-neutral-100">
                <td className="px-4 py-3">
                  <div className="font-medium text-navy">{a.full_name || a.email}</div>
                  <div className="text-xs text-neutral-500">{a.email}</div>
                </td>
                <td className="px-4 py-3">
                  <select value={a.role} onChange={(e) => updateRole(a.id, e.target.value)} className="border rounded px-2 py-1 bg-white text-xs">
                    <option value="super_admin">Super admin</option>
                    <option value="order_manager">Order manager</option>
                    <option value="content_manager">Content manager</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {a.is_active ? <span className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5">Active</span>
                    : <span className="text-xs bg-neutral-100 text-neutral-500 rounded-full px-2 py-0.5">Disabled</span>}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => resetPwd(a.id)} title="Reset password" className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-navy px-2 py-1"><KeyRound className="w-3.5 h-3.5" /> Reset</button>
                  <button onClick={() => toggleActive(a.id, !a.is_active)} title="Toggle active" className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-navy px-2 py-1"><Ban className="w-3.5 h-3.5" /> {a.is_active ? "Disable" : "Enable"}</button>
                  <button onClick={() => remove(a.id)} title="Remove" className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invites.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-3">Pending invites</h2>
          <ul className="space-y-2">
            {invites.map((i) => (
              <li key={i.id} className="bg-white border border-neutral-200 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
                <div><Mail className="w-4 h-4 inline mr-1 text-gold" /> {i.email} — <span className="text-xs uppercase text-gold">{i.role.replace(/_/g, " ")}</span></div>
                <span className="text-xs text-neutral-400">Expires {new Date(i.expires_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
