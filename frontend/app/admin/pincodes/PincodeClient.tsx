"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Upload, Search, Filter, X } from "lucide-react";

type Pincode = {
  pincode: string;
  city: string | null;
  state: string | null;
  is_serviceable: boolean;
  cod_available: boolean;
  est_delivery_days: number | null;
};

export default function PincodeClient({ initial }: { initial: Pincode[] }) {
  const [list, setList] = useState<Pincode[]>(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "serviceable" | "non_serviceable">("all");
  const [editMode, setEditMode] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const filtered = list.filter((p) => {
    const matchesSearch = !search || p.pincode.includes(search) || p.city?.toLowerCase().includes(search.toLowerCase()) || p.state?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "serviceable" && p.is_serviceable) || (filter === "non_serviceable" && !p.is_serviceable);
    return matchesSearch && matchesFilter;
  });

  const savePincode = async (p: Pincode) => {
    const res = await fetch("/api/admin/pincodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    if (!res.ok) return toast.error("Save failed");
    toast.success("Saved");
    setEditMode(null);
  };

  const deletePincode = async (pincode: string) => {
    if (!confirm(`Delete pincode ${pincode}?`)) return;
    const res = await fetch(`/api/admin/pincodes/${pincode}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Delete failed");
    setList(list.filter((p) => p.pincode !== pincode));
    toast.success("Deleted");
  };

  const addNew = () => {
    const newPin: Pincode = {
      pincode: "",
      city: "",
      state: "",
      is_serviceable: true,
      cod_available: true,
      est_delivery_days: 5,
    };
    setList([newPin, ...list]);
    setEditMode("");
  };

  const bulkImport = async () => {
    if (!bulkText.trim()) return toast.error("Paste CSV data first");
    const lines = bulkText.trim().split("\n").filter((l) => l.trim());
    const rows: Pincode[] = [];
    for (const line of lines) {
      const [pincode, city, state, serviceable, cod, days] = line.split(",").map((s) => s.trim());
      if (!pincode) continue;
      rows.push({
        pincode,
        city: city || "",
        state: state || "",
        is_serviceable: serviceable?.toLowerCase() !== "false",
        cod_available: cod?.toLowerCase() !== "false",
        est_delivery_days: parseInt(days) || 5,
      });
    }
    if (rows.length === 0) return toast.error("No valid rows found");
    const res = await fetch("/api/admin/pincodes/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pincodes: rows }),
    });
    if (!res.ok) return toast.error("Bulk import failed");
    toast.success(`Imported ${rows.length} pincodes`);
    setBulkText("");
    setShowBulk(false);
    // Refresh list
    const { data } = await (await fetch("/api/admin/pincodes")).json();
    setList(data ?? []);
  };

  const update = (pincode: string, patch: Partial<Pincode>) => {
    setList(list.map((p) => (p.pincode === pincode ? { ...p, ...patch } : p)));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold font-bold">Logistics</p>
          <h1 className="font-display text-2xl md:text-3xl text-navy tracking-tight">Pincode Management</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(!showBulk)} className="bg-white border border-navy/20 text-navy rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-navy/5">
            <Upload className="w-4 h-4" /> Bulk import
          </button>
          <button onClick={addNew} className="bg-navy text-white rounded-lg px-3 py-2 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add pincode
          </button>
        </div>
      </div>

      {showBulk && (
        <div className="bg-white rounded-lg p-5 shadow-soft mb-4 border-l-4 border-gold">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium text-navy">Bulk CSV import</h2>
            <button onClick={() => setShowBulk(false)} className="p-1 hover:bg-neutral-100 rounded"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-neutral-500 mb-3">Format: <code className="bg-neutral-100 px-1 rounded">pincode,city,state,serviceable,cod,days</code> (one per line)</p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={8}
            placeholder="400001,Mumbai,Maharashtra,true,true,3&#10;110001,Delhi,Delhi,true,true,5&#10;560001,Bengaluru,Karnataka,true,true,5"
            className="w-full border rounded px-3 py-2 text-sm font-mono"
          />
          <button onClick={bulkImport} className="mt-2 bg-navy text-white rounded px-4 py-2 text-sm">Import</button>
        </div>
      )}

      <div className="bg-white rounded-lg p-4 shadow-soft mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-neutral-50 rounded px-3 py-2">
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pincode, city, state..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-neutral-50 rounded px-3 py-2">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="bg-transparent text-sm outline-none">
              <option value="all">All pincodes</option>
              <option value="serviceable">Serviceable only</option>
              <option value="non_serviceable">Non-serviceable</option>
            </select>
          </div>
        </div>
      </div>

      <div className="text-sm text-neutral-600 mb-2">Showing {filtered.length} of {list.length} pincodes</div>

      <div className="bg-white rounded-lg shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-navy">Pincode</th>
                <th className="px-4 py-3 text-left font-medium text-navy">City</th>
                <th className="px-4 py-3 text-left font-medium text-navy">State</th>
                <th className="px-4 py-3 text-center font-medium text-navy">Serviceable</th>
                <th className="px-4 py-3 text-center font-medium text-navy">COD</th>
                <th className="px-4 py-3 text-center font-medium text-navy">Delivery (days)</th>
                <th className="px-4 py-3 text-right font-medium text-navy">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((p) => (
                <tr key={p.pincode} className="hover:bg-neutral-50/50">
                  {editMode === p.pincode ? (
                    <>
                      <td className="px-4 py-2"><input value={p.pincode} onChange={(e) => update(p.pincode, { pincode: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" /></td>
                      <td className="px-4 py-2"><input value={p.city ?? ""} onChange={(e) => update(p.pincode, { city: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" /></td>
                      <td className="px-4 py-2"><input value={p.state ?? ""} onChange={(e) => update(p.pincode, { state: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" /></td>
                      <td className="px-4 py-2 text-center"><input type="checkbox" checked={p.is_serviceable} onChange={(e) => update(p.pincode, { is_serviceable: e.target.checked })} /></td>
                      <td className="px-4 py-2 text-center"><input type="checkbox" checked={p.cod_available} onChange={(e) => update(p.pincode, { cod_available: e.target.checked })} /></td>
                      <td className="px-4 py-2 text-center"><input type="number" value={p.est_delivery_days ?? 5} onChange={(e) => update(p.pincode, { est_delivery_days: parseInt(e.target.value) })} className="w-20 border rounded px-2 py-1 text-sm text-center" /></td>
                      <td className="px-4 py-2 text-right"><button onClick={() => savePincode(p)} className="text-xs bg-navy text-white rounded px-3 py-1"><Save className="w-3 h-3 inline mr-1" /> Save</button></td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 font-mono font-medium text-navy">{p.pincode}</td>
                      <td className="px-4 py-2">{p.city}</td>
                      <td className="px-4 py-2">{p.state}</td>
                      <td className="px-4 py-2 text-center">{p.is_serviceable ? <span className="text-green-600">✓</span> : <span className="text-neutral-400">—</span>}</td>
                      <td className="px-4 py-2 text-center">{p.cod_available ? <span className="text-green-600">✓</span> : <span className="text-neutral-400">—</span>}</td>
                      <td className="px-4 py-2 text-center">{p.est_delivery_days ?? "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => setEditMode(p.pincode)} className="text-xs text-gold hover:underline mr-2">Edit</button>
                        <button onClick={() => deletePincode(p.pincode)} className="text-xs text-error hover:underline"><Trash2 className="w-3 h-3 inline" /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
