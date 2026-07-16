"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import Image from "next/image";
import { toast } from "sonner";
import { cart } from "@/lib/cart";
import type { CartLine } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { CreditCard, Wallet, Check } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [placing, setPlacing] = useState(false);

  const [addr, setAddr] = useState({
    full_name: "",
    phone: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [pincodeInfo, setPincodeInfo] = useState<any>(null);
  const [payment, setPayment] = useState<"razorpay" | "cod">("razorpay");
  const [totals, setTotals] = useState({ subtotal: 0, shipping: 0, tax: 0, discount: 0, total: 0 });

  useEffect(() => {
    setLines(cart.get());
  }, []);

  useEffect(() => {
    (async () => {
      const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
      if (!subtotal) return;
      const r = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtotal, pincode: addr.pincode }),
      });
      const j = await r.json();
      setTotals({ subtotal, shipping: j.shipping, tax: j.tax, discount: 0, total: j.total });
    })();
  }, [lines, addr.pincode]);

  const checkPincode = async () => {
    if (!/^\d{6}$/.test(addr.pincode)) return;
    const r = await fetch(`/api/pincode?code=${addr.pincode}`);
    const j = await r.json();
    setPincodeInfo(j);
    if (j.serviceable) {
      setAddr((a) => ({ ...a, city: a.city || j.city, state: a.state || j.state }));
    }
  };

  const validate1 = () => {
    if (!addr.full_name || !addr.phone || !addr.email || !addr.line1 || !addr.city || !addr.state || !addr.pincode) {
      toast.error("Please complete all address fields");
      return false;
    }
    if (!/^\d{10}$/.test(addr.phone)) return toast.error("Phone must be 10 digits") && false;
    if (!/^\d{6}$/.test(addr.pincode)) return toast.error("Pincode must be 6 digits") && false;
    if (pincodeInfo && !pincodeInfo.serviceable) return toast.error("We don't ship here yet") && false;
    return true;
  };

  const placeOrder = async () => {
    if (!lines.length) return;
    setPlacing(true);
    try {
      const r = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({ variant_id: l.variant_id, quantity: l.quantity })),
          address: addr,
          payment_method: payment,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Could not place order");

      if (payment === "cod" || !j.razorpay_order_id) {
        cart.clear();
        toast.success("Order placed!");
        router.push(`/orders/${j.order_number}?new=1`);
        return;
      }

      // Razorpay
      const options = {
        key: j.key_id,
        amount: j.amount,
        currency: "INR",
        name: "Jack & Jill",
        description: `Order ${j.order_number}`,
        order_id: j.razorpay_order_id,
        prefill: { name: addr.full_name, email: addr.email, contact: addr.phone },
        theme: { color: "#1E2A4A" },
        handler: async (resp: any) => {
          await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: j.order_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          });
          cart.clear();
          toast.success("Payment successful!");
          router.push(`/orders/${j.order_number}?new=1`);
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled");
            setPlacing(false);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPlacing(false);
    }
  };

  if (!lines.length) {
    return (
      <div className="container py-24 text-center">
        <p className="font-display text-3xl text-navy">Your bag is empty</p>
        <Link href="/shop" className="inline-block mt-6 bg-navy text-white rounded px-6 py-3">Continue shopping</Link>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="container py-12 md:py-16">
        <h1 className="font-display text-3xl md:text-4xl text-navy mb-6">Checkout</h1>

        {/* Stepper */}
        <div className="flex items-center gap-3 mb-8">
          {[
            { n: 1, label: "Address" },
            { n: 2, label: "Payment" },
            { n: 3, label: "Review" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= (s.n as 1|2|3) ? "bg-navy text-white" : "bg-navy/10 text-navy/60"}`}>
                {step > (s.n as 1|2|3) ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span className={`text-sm font-medium ${step >= (s.n as 1|2|3) ? "text-navy" : "text-muted"}`}>{s.label}</span>
              {i < 2 && <div className="w-8 h-px bg-navy/20 mx-1" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div>
            {step === 1 && (
              <div className="bg-white rounded-lg p-6 shadow-soft space-y-4" data-testid="checkout-address">
                <h2 className="font-display text-xl text-navy">Shipping address</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full name" value={addr.full_name} onChange={(v) => setAddr({ ...addr, full_name: v })} testid="addr-name" />
                  <Field label="Phone" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v.replace(/\D/g, "").slice(0, 10) })} testid="addr-phone" />
                </div>
                <Field label="Email" value={addr.email} onChange={(v) => setAddr({ ...addr, email: v })} testid="addr-email" />
                <Field label="Address line 1" value={addr.line1} onChange={(v) => setAddr({ ...addr, line1: v })} testid="addr-line1" />
                <Field label="Address line 2 (optional)" value={addr.line2} onChange={(v) => setAddr({ ...addr, line2: v })} testid="addr-line2" />
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Pincode" value={addr.pincode} onChange={(v) => setAddr({ ...addr, pincode: v.replace(/\D/g, "").slice(0, 6) })} onBlur={checkPincode} testid="addr-pincode" />
                  <Field label="City" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} testid="addr-city" />
                  <Field label="State" value={addr.state} onChange={(v) => setAddr({ ...addr, state: v })} testid="addr-state" />
                </div>
                {pincodeInfo && (
                  <p className={`text-xs ${pincodeInfo.serviceable ? "text-success" : "text-error"}`}>
                    {pincodeInfo.serviceable ? `Delivery in ~${pincodeInfo.est_delivery_days} days${pincodeInfo.cod_available ? "  •  COD available" : ""}` : "Sorry, we don't ship to this pincode."}
                  </p>
                )}
                <button data-testid="to-payment-btn" onClick={() => validate1() && setStep(2)} className="bg-navy text-white rounded px-6 py-3 font-medium">Continue to Payment</button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-lg p-6 shadow-soft" data-testid="checkout-payment">
                <h2 className="font-display text-xl text-navy mb-4">Payment method</h2>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${payment === "razorpay" ? "border-gold bg-cream" : "border-navy/10"}`}>
                    <input type="radio" name="pay" checked={payment === "razorpay"} onChange={() => setPayment("razorpay")} className="accent-navy" data-testid="pay-razorpay" />
                    <CreditCard className="w-5 h-5 text-navy" />
                    <div>
                      <p className="font-medium text-navy">Cards, UPI & Netbanking</p>
                      <p className="text-xs text-muted">Secure payment via Razorpay</p>
                    </div>
                  </label>
                  {pincodeInfo?.cod_available !== false && (
                    <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${payment === "cod" ? "border-gold bg-cream" : "border-navy/10"}`}>
                      <input type="radio" name="pay" checked={payment === "cod"} onChange={() => setPayment("cod")} className="accent-navy" data-testid="pay-cod" />
                      <Wallet className="w-5 h-5 text-navy" />
                      <div>
                        <p className="font-medium text-navy">Cash on Delivery</p>
                        <p className="text-xs text-muted">Pay when your order arrives</p>
                      </div>
                    </label>
                  )}
                </div>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => setStep(1)} className="border border-navy/10 rounded px-6 py-3 text-sm">Back</button>
                  <button data-testid="to-review-btn" onClick={() => setStep(3)} className="flex-1 bg-navy text-white rounded px-6 py-3 font-medium">Review order</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-lg p-6 shadow-soft space-y-4" data-testid="checkout-review">
                <h2 className="font-display text-xl text-navy">Review & place order</h2>
                <div className="text-sm">
                  <p className="text-navy font-medium">{addr.full_name}</p>
                  <p className="text-muted">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} {addr.pincode}</p>
                  <p className="text-muted">{addr.phone} • {addr.email}</p>
                </div>
                <p className="text-sm text-navy">Payment: <strong>{payment === "razorpay" ? "Online (Razorpay)" : "Cash on Delivery"}</strong></p>
                <div className="pt-2 flex gap-3">
                  <button onClick={() => setStep(2)} className="border border-navy/10 rounded px-6 py-3 text-sm">Back</button>
                  <button
                    data-testid="place-order-btn"
                    disabled={placing}
                    onClick={placeOrder}
                    className="flex-1 bg-brand-gradient text-white rounded px-6 py-3 font-bold disabled:opacity-60 shadow-premium"
                  >
                    {placing ? "Placing..." : `Place order • ${formatINR(totals.total)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          <aside className="bg-white rounded-lg p-6 shadow-soft h-fit sticky top-24">
            <h3 className="font-display text-lg text-navy mb-4">Order summary</h3>
            <ul className="divide-y divide-navy/5">
              {lines.map((l) => (
                <li key={l.variant_id} className="py-3 flex gap-3">
                  <div className="relative w-14 h-14 rounded overflow-hidden bg-cream shrink-0">
                    {l.image && <Image src={l.image} alt={l.product_name} fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy line-clamp-2">{l.product_name}</p>
                    <p className="text-xs text-muted">{l.variant_label} × {l.quantity}</p>
                  </div>
                  <p className="text-sm text-navy font-medium">{formatINR(l.price * l.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 text-sm">
              <Row l="Subtotal" v={formatINR(totals.subtotal)} />
              <Row l="Shipping" v={totals.shipping === 0 ? "FREE" : formatINR(totals.shipping)} />
              <Row l="Tax (incl.)" v={formatINR(totals.tax)} />
              <div className="pt-3 mt-3 border-t border-navy/10 flex justify-between font-display text-lg text-navy">
                <span>Total</span><span data-testid="checkout-total">{formatINR(totals.total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, onChange, onBlur, testid }: { label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; testid?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-navy font-bold">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        data-testid={testid}
        className="mt-1 w-full bg-cream border border-navy/10 rounded px-3 py-2.5 text-sm outline-none focus:border-gold"
      />
    </label>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{l}</span>
      <span className="text-navy">{v}</span>
    </div>
  );
}
