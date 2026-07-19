"use client";
import { Download, MessageCircle } from "lucide-react";

export default function OrderActions({ orderNumber, phone, status }: { orderNumber: string; phone?: string; status?: string }) {
  const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
  const waLinkOrder = cleanPhone ? `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : ("91" + cleanPhone)}?text=${encodeURIComponent(`Hi, regarding your Jack & Jill order ${orderNumber}...`)}` : "";
  const waLinkStatus = cleanPhone && status ? `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : ("91" + cleanPhone)}?text=${encodeURIComponent(`Hi! Update on your Jack & Jill order ${orderNumber}: status is now "${status.replace(/_/g, " ")}". You can track live here: ${typeof window !== "undefined" ? window.location.origin : ""}/track`)}` : "";

  return (
    <div className="flex flex-wrap gap-2">
      <a href={`/api/orders/${orderNumber}/invoice`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 bg-navy text-white rounded-lg px-3 py-2 text-xs font-medium hover:bg-navy/90"><Download className="w-3.5 h-3.5" /> Download invoice</a>
      {waLinkOrder && <a href={waLinkOrder} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 bg-green-600 text-white rounded-lg px-3 py-2 text-xs font-medium hover:bg-green-700"><MessageCircle className="w-3.5 h-3.5" /> Chat on WhatsApp</a>}
      {waLinkStatus && <a href={waLinkStatus} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 border border-green-600 text-green-700 rounded-lg px-3 py-2 text-xs font-medium hover:bg-green-50"><MessageCircle className="w-3.5 h-3.5" /> Send status via WhatsApp</a>}
    </div>
  );
}
