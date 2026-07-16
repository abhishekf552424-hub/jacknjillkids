"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill name, email and message.");
      return;
    }
    setSending(true);
    const r = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, message }),
    });
    setSending(false);
    if (r.ok) {
      toast.success("Thanks! We'll be in touch soon.");
      setName(""); setEmail(""); setPhone(""); setMessage("");
    } else {
      toast.error("Could not send. Please try again.");
    }
  };

  return (
    <div className="container py-12 md:py-20 max-w-5xl">
      <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Get in Touch</p>
      <h1 className="font-display text-4xl md:text-5xl text-navy tracking-tight">We'd love to hear from you</h1>
      <p className="mt-3 text-muted">Questions, feedback, gifting requests — reach out. We reply within a day.</p>

      <div className="mt-12 grid md:grid-cols-2 gap-10">
        <form onSubmit={submit} className="bg-white rounded-lg p-6 shadow-soft space-y-4" data-testid="contact-form">
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-navy">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full bg-cream rounded px-3 py-2.5 border border-navy/10 focus:border-gold outline-none text-sm" data-testid="contact-name" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-navy">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full bg-cream rounded px-3 py-2.5 border border-navy/10 focus:border-gold outline-none text-sm" data-testid="contact-email" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-navy">Phone (optional)</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full bg-cream rounded px-3 py-2.5 border border-navy/10 focus:border-gold outline-none text-sm" data-testid="contact-phone" />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-navy">Message</label>
            <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full bg-cream rounded px-3 py-2.5 border border-navy/10 focus:border-gold outline-none text-sm" data-testid="contact-message" />
          </div>
          <button disabled={sending} className="w-full bg-navy text-white rounded py-3 font-medium disabled:opacity-60 flex items-center justify-center gap-2" data-testid="contact-submit">
            <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send message"}
          </button>
        </form>

        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-soft flex gap-4">
            <div className="w-11 h-11 rounded-full bg-brand-gradient text-white flex items-center justify-center shrink-0"><MapPin className="w-5 h-5" /></div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gold font-bold">Store</p>
              <p className="text-navy mt-1">Opp. Shahji Law College, E Ward,<br />Shahupuri, Kolhapur, Maharashtra 416001</p>
              <p className="text-xs text-muted mt-2">Mon–Sun, 10 AM – 9 PM</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-soft flex gap-4">
            <div className="w-11 h-11 rounded-full bg-brand-gradient text-white flex items-center justify-center shrink-0"><Phone className="w-5 h-5" /></div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gold font-bold">Call us</p>
              <a href="tel:+918329984160" className="text-navy mt-1 block">+91 83299 84160</a>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-soft flex gap-4">
            <div className="w-11 h-11 rounded-full bg-brand-gradient text-white flex items-center justify-center shrink-0"><Mail className="w-5 h-5" /></div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gold font-bold">Email</p>
              <a href="mailto:hello@jacknjillkids.com" className="text-navy mt-1 block">hello@jacknjillkids.com</a>
            </div>
          </div>
          <div className="bg-white rounded-lg overflow-hidden shadow-soft">
            <iframe
              src="https://www.google.com/maps?q=Shahji+Law+College+Shahupuri+Kolhapur&output=embed"
              className="w-full aspect-video"
              loading="lazy"
              title="Jack & Jill Store Location"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
