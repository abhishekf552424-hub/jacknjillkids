"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Paperclip, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";

/**
 * Phase T — Floating support chat widget.
 * Bottom-right on every page. Two entry points:
 *  1) "Chat on WhatsApp" — opens wa.me/<business> in new tab with prefilled greeting.
 *  2) "Ask us here" — inline form (message + optional screenshot) → creates a
 *     ticket in the existing support_tickets table via /api/support.
 */
export default function SupportChat({
  whatsappNumber,
  siteName = "Jack & Jill",
}: {
  whatsappNumber?: string;
  siteName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "form" | "sent">("menu");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const waHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${siteName}, I have a question about...`)}`
    : "";

  useEffect(() => {
    if (!open) setView("menu");
  }, [open]);

  const pickFile = () => fileRef.current?.click();

  const onFile = (f: File) => {
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) {
      toast.error("Image too large (max 3 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment(String(reader.result || ""));
      setAttachmentName(f.name);
    };
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!message.trim()) {
      toast.error("Please type your question.");
      return;
    }
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Please enter a valid email so we can reply.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          attachment_url: attachment || undefined,
          guest_name: name.trim() || undefined,
          guest_email: email.trim(),
          guest_phone: phone.trim() || undefined,
        }),
      });
      if (!r.ok) throw new Error((await r.json())?.error || "Failed");
      setView("sent");
      // clear the form for next time
      setMessage("");
      setAttachment("");
      setAttachmentName("");
    } catch (e: any) {
      toast.error(e.message || "Could not send");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Floating launcher — always visible bottom-right */}
      <button
        aria-label="Support chat"
        data-testid="support-launcher"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[70] w-14 h-14 rounded-full bg-brand-gradient text-white shadow-premium flex items-center justify-center hover:scale-105 transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          data-testid="support-panel"
          className="fixed bottom-24 right-5 z-[70] w-[92vw] max-w-sm bg-white rounded-2xl shadow-premium border border-navy/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="bg-navy text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {view !== "menu" && view !== "sent" && (
                <button aria-label="Back" onClick={() => setView("menu")} className="p-1 -ml-1 rounded hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <p className="font-display text-base leading-none">Hi there 👋</p>
                <p className="text-[11px] opacity-80 mt-0.5">We reply within a few hours (10am-9pm IST).</p>
              </div>
            </div>
            <button aria-label="Close" onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10"><X className="w-4 h-4" /></button>
          </div>

          {view === "menu" && (
            <div className="p-4 space-y-3">
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="support-whatsapp"
                  className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 hover:bg-green-100 transition-colors"
                >
                  <span className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold">W</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy">Chat on WhatsApp</p>
                    <p className="text-[11px] text-muted">Fastest — usually replies within minutes</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted" />
                </a>
              )}
              <button
                onClick={() => setView("form")}
                data-testid="support-open-form"
                className="w-full flex items-center gap-3 rounded-lg border border-navy/10 bg-cream/40 p-3 hover:bg-cream transition-colors text-left"
              >
                <span className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy">Ask us here</p>
                  <p className="text-[11px] text-muted">Send a message + optional screenshot</p>
                </div>
              </button>
              <p className="text-[11px] text-muted text-center pt-1">Powered by Jack &amp; Jill Care</p>
            </div>
          )}

          {view === "form" && (
            <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
              <label className="block">
                <span className="text-[11px] uppercase tracking-widest text-navy font-bold">Your name (optional)</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Riya" className="mt-1 w-full border border-navy/10 rounded px-3 py-2 text-sm outline-none focus:border-gold" />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-widest text-navy font-bold">Email <span className="text-red-500">*</span></span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full border border-navy/10 rounded px-3 py-2 text-sm outline-none focus:border-gold" />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-widest text-navy font-bold">Phone (optional)</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1 w-full border border-navy/10 rounded px-3 py-2 text-sm outline-none focus:border-gold" />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-widest text-navy font-bold">Your question <span className="text-red-500">*</span></span>
                <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" className="mt-1 w-full border border-navy/10 rounded px-3 py-2 text-sm outline-none focus:border-gold" />
              </label>

              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
                {attachment ? (
                  <div className="flex-1 flex items-center gap-2 border border-navy/10 rounded px-2 py-1.5 bg-cream/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={attachment} alt="" className="w-8 h-8 rounded object-cover" />
                    <span className="text-xs text-navy truncate flex-1">{attachmentName}</span>
                    <button type="button" aria-label="Remove attachment" onClick={() => { setAttachment(""); setAttachmentName(""); }} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={pickFile} data-testid="support-attach" className="flex-1 flex items-center gap-2 border border-dashed border-navy/20 rounded px-3 py-2 text-xs text-muted hover:border-gold hover:text-navy transition-colors">
                    <Paperclip className="w-4 h-4" /> Attach a screenshot (optional, max 3 MB)
                  </button>
                )}
              </div>

              <button
                onClick={submit}
                disabled={busy}
                data-testid="support-submit"
                className="w-full bg-navy text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                <Send className="w-4 h-4" /> {busy ? "Sending…" : "Send message"}
              </button>
              <p className="text-[10px] text-muted text-center pt-1">We&apos;ll reply to your email — usually within a few hours.</p>
            </div>
          )}

          {view === "sent" && (
            <div className="p-6 text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto text-2xl">✓</div>
              <p className="font-display text-lg text-navy">Message sent!</p>
              <p className="text-sm text-muted">We&apos;ve got your question and will reply to your email shortly.</p>
              <button onClick={() => setOpen(false)} className="mt-2 bg-navy text-white rounded px-4 py-2 text-sm">Close</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
