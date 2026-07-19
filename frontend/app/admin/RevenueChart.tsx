"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart } from "recharts";
import { TrendingUp, ShoppingBag } from "lucide-react";

type Range = "today" | "week" | "month" | "year" | "custom";

function rangeBounds(r: Range, from?: string, to?: string): [Date, Date] {
  const now = new Date();
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  if (r === "today") return [start, end];
  if (r === "week") { const s = new Date(start); s.setDate(s.getDate() - 6); return [s, end]; }
  if (r === "month") { const s = new Date(start); s.setDate(s.getDate() - 29); return [s, end]; }
  if (r === "year") { const s = new Date(start); s.setMonth(s.getMonth() - 11); s.setDate(1); return [s, end]; }
  return [from ? new Date(from) : start, to ? new Date(to) : end];
}

function formatINR(n: number) { return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 }); }

export default function RevenueChart() {
  const [range, setRange] = useState<Range>("week");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<{ date: string; revenue: number; orders: number }[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, orders: 0 });
  const [loading, setLoading] = useState(false);

  const [start, end] = useMemo(() => rangeBounds(range, from, to), [range, from, to]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const params = new URLSearchParams({ from: start.toISOString(), to: end.toISOString() });
      const r = await fetch(`/api/admin/dashboard/revenue?${params.toString()}`);
      const j = await r.json();
      setRows(j.buckets || []);
      setTotals({ revenue: j.revenue || 0, orders: j.orders || 0 });
      setLoading(false);
    })();
  }, [start.getTime(), end.getTime()]);

  const useBar = range === "today";

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 shadow-soft">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gold" />
          <h2 className="font-display text-xl text-navy">Revenue</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {([["today", "Today"], ["week", "This week"], ["month", "This month"], ["year", "This year"], ["custom", "Custom"]] as [Range, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setRange(k)} className={`text-xs rounded-full px-3 py-1.5 border ${range === k ? "bg-navy text-white border-navy" : "bg-white text-navy border-neutral-200 hover:border-navy"}`}>{l}</button>
          ))}
          {range === "custom" && (
            <div className="flex items-center gap-1 ml-2">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="text-xs border rounded px-2 py-1" />
              <span className="text-xs text-neutral-400">to</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="text-xs border rounded px-2 py-1" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
        <div className="bg-cream/50 rounded-lg px-4 py-3"><div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Revenue</div><div className="font-display text-xl md:text-2xl text-navy mt-1">{formatINR(totals.revenue)}</div></div>
        <div className="bg-cream/50 rounded-lg px-4 py-3"><div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Orders</div><div className="font-display text-xl md:text-2xl text-navy mt-1">{totals.orders}</div></div>
      </div>

      <div className="h-56 md:h-64 w-full">
        {loading ? <div className="h-full grid place-items-center text-xs text-neutral-400">Loading…</div> : rows.length === 0 ? <div className="h-full grid place-items-center text-xs text-neutral-400">No orders in this range</div> : (
          <ResponsiveContainer width="100%" height="100%">
            {useBar ? (
              <BarChart data={rows}><CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(v: any) => formatINR(Number(v))} /><Bar dataKey="revenue" fill="#C9992E" radius={[4, 4, 0, 0]} /></BarChart>
            ) : (
              <LineChart data={rows}><CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(v: any) => formatINR(Number(v))} /><Line type="monotone" dataKey="revenue" stroke="#1E2A4A" strokeWidth={2} dot={{ r: 3, fill: "#C9992E" }} /></LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
