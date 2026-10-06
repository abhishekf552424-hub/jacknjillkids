"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/track";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import Image from "next/image";
import { toast } from "sonner";
import { cart } from "@/lib/cart";
import type { CartLine } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { CreditCard, Wallet, Check } from "lucide-react";
import BrandLoader from "@/components/BrandLoader";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  // An online order already created whose payment window was closed: reuse it
  // instead of creating a second order (each order holds stock).
  const [pending, setPending] = useState<{ j: any; key: string; at: number } | null>(null);
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
  const [payment, setPayment] = useState<"razorpay" | "cod">("razorpay");
  // Payment choices switched on in Admin → Settings.
  const [payOpts, setPayOpts] = useState<{ cod: boolean; online: boolean }>({ cod: true, online: true });
  useEffect(() => {
    fetch("/api/checkout/options", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((o) => {
        if (!o) return;
        setPayOpts(o);
        if (!o.online && o.cod) setPayment("cod");
      })
      .catch(() => {});
  }, []);
  const [totals, setTotals] = useState({ subtotal: 0, shipping: 0, tax: 0, discount: 0, total: 0 });
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  useEffect(() => {
    const l = cart.get();
    setLines(l);
    setLoaded(true);
    if (l.length) {
      track(
        "begin_checkout",
        l.map((x) => ({ id: x.product_id, name: x.product_name, price: x.price, quantity: x.quantity, variant: x.variant_label })),
      );
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (!lines.length) return;
      try {
        const r = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lines: lines.map((l) => ({ variant_id: l.variant_id, quantity: l.quantity })),
            coupon_code: appliedCoupon || undefined,
            email: addr.email || undefined,
            phone: addr.phone || undefined,
          }),
        });
        const j = await r.json();
        if (!r.ok) return;
        if (appliedCoupon && j.coupon_error) {
          // Cart changed and the coupon no longer applies (e.g. below minimum).
          toast.error(j.coupon_error);
          setAppliedCoupon(null);
        }
        setTotals({ subtotal: j.subtotal, shipping: j.shipping, tax: j.tax, discount: j.discount ?? 0, total: j.total });
      } catch {
        /* totals stay as they were; the server re-checks everything at order time */
      }
    })();
  }, [lines, appliedCoupon]);

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const r = await fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: lines.map((l) => ({ variant_id: l.variant_id, quantity: l.quantity })),
        coupon_code: code,
        email: addr.email || undefined,
        phone: addr.phone || undefined,
      }),
    }).catch(() => null);
    if (!r) return toast.error("No internet connection. Please try again.");
    const j = await r.json().catch(() => ({}));
    if (j.coupon_error || !j.coupon) {
      toast.error(j.coupon_error || "This coupon is not valid");
      return;
    }
    setAppliedCoupon(j.coupon.code);
    toast.success(`Coupon ${j.coupon.code} applied — you save ${formatINR(j.discount)}`);
  };

  const validate1 = () => {
    if (!addr.full_name || !addr.phone || !addr.email || !addr.line1 || !addr.city || !addr.state || !addr.pincode) {
      toast.error("Please complete all address fields");
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(addr.phone)) return toast.error("Please enter a valid 10-digit mobile number") && false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(addr.email.trim())) return toast.error("Please enter a valid email address") && false;
    if (!/^[1-9]\d{5}$/.test(addr.pincode)) return toast.error("Please enter your 6-digit pincode") && false;
    return true;
  };

  const cartKey = JSON.stringify([lines.map((l) => [l.variant_id, l.quantity]), addr, appliedCoupon]);

  const openRazorpay = (j: any) => {
    const options = {
      key: j.key_id,
      amount: j.amount,
      currency: "INR",
      name: "Jack & Jill",
      description: `Order ${j.order_number}`,
      order_id: j.razorpay_order_id,
      prefill: { name: addr.full_name, email: addr.email, contact: addr.phone },
      theme: { color: "#354275" },
      handler: async (resp: any) => {
        try {
          const v = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: j.order_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          });
          if (!v.ok) throw new Error("verify");
          cart.clear();
          setPending(null);
          toast.success("Payment successful!");
          router.push(`/orders/${j.order_number}?new=1&t=${j.access_token ?? ""}`);
        } catch {
          // The bank may still confirm it (Razorpay also tells our server directly).
          toast.error("We couldn't confirm your payment yet. Please don't pay again — check your order page in a minute.");
          router.push(`/orders/${j.order_number}?t=${j.access_token ?? ""}`);
        }
      },
      modal: {
        ondismiss: () => {
          toast.info("Payment not completed. Your items are held for a few minutes — tap Place order to try again.");
          setPlacing(false);
        },
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.on?.("payment.failed", () => toast.error("Payment failed. You can try again or choose Cash on Delivery."));
    rzp.open();
  };

  const placeOrder = async () => {
    if (!lines.length || placing) return;
    if (payment === "razorpay" && typeof window.Razorpay !== "function") {
      return toast.error("Payment window is still loading. Please wait a second and try again.");
    }
    setPlacing(true);
    // Same bag, address and coupon as the order we just made? Reopen its payment window.
    if (payment === "razorpay" && pending && pending.key === cartKey && Date.now() - pending.at < 35 * 60_000) {
      openRazorpay(pending.j);
      return;
    }
    try {
      const r = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({ variant_id: l.variant_id, quantity: l.quantity })),
          address: addr,
          payment_method: payment,
          coupon_code: appliedCoupon || undefined,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Could not place order");

      if (payment === "cod" || !j.razorpay_order_id) {
        cart.clear();
        toast.success("Order placed!");
        router.push(`/orders/${j.order_number}?new=1&t=${j.access_token ?? ""}`);
        return;
      }

      setPending({ j, key: cartKey, at: Date.now() });
      openRazorpay(j); // the button stays busy until the payment window closes
    } catch (e: any) {
      toast.error(e?.message === "Failed to fetch" ? "No internet connection. Please try again." : e?.message || "Could not place order");
      setPlacing(false);
    }
  };

  if (!loaded) {
    return <div className="container py-24 flex justify-center"><BrandLoader label="Loading your bag" /></div>;
  }

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
                  <Field label="Full name" value={addr.full_name} onChange={(v) => setAddr({ ...addr, full_name: v })} testid="addr-name" autoComplete="name" maxLength={80} />
                  <Field label="Phone" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v.replace(/\D/g, "").slice(0, 10) })} testid="addr-phone" type="tel" inputMode="numeric" autoComplete="tel-national" />
                </div>
                <Field label="Email" value={addr.email} onChange={(v) => setAddr({ ...addr, email: v })} testid="addr-email" type="email" inputMode="email" autoComplete="email" maxLength={120} />
                <Field label="Address line 1" value={addr.line1} onChange={(v) => setAddr({ ...addr, line1: v })} testid="addr-line1" autoComplete="address-line1" />
                <Field label="Address line 2 (optional)" value={addr.line2} onChange={(v) => setAddr({ ...addr, line2: v })} testid="addr-line2" autoComplete="address-line2" />
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Pincode" value={addr.pincode} onChange={(v) => setAddr({ ...addr, pincode: v.replace(/\D/g, "").slice(0, 6) })} testid="addr-pincode" inputMode="numeric" autoComplete="postal-code" />
                  <Field label="City" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} testid="addr-city" autoComplete="address-level2" maxLength={80} />
                  <Field label="State" value={addr.state} onChange={(v) => setAddr({ ...addr, state: v })} testid="addr-state" autoComplete="address-level1" maxLength={80} />
                </div>
                <button data-testid="to-payment-btn" onClick={() => validate1() && setStep(2)} className="bg-navy text-white rounded px-6 py-3 font-medium">Continue to Payment</button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-lg p-6 shadow-soft" data-testid="checkout-payment">
                <h2 className="font-display text-xl text-navy mb-4">Payment method</h2>
                <div className="space-y-3">
                  {!payOpts.online && !payOpts.cod && (
                    <p className="rounded-lg bg-blush p-4 text-sm text-navy">Online orders are paused for a short while. Please call or WhatsApp the store to order.</p>
                  )}
                  {payOpts.online && (
                  <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${payment === "razorpay" ? "border-gold bg-cream" : "border-navy/10"}`}>
                    <input type="radio" name="pay" checked={payment === "razorpay"} onChange={() => setPayment("razorpay")} className="accent-navy" data-testid="pay-razorpay" />
                    <CreditCard className="w-5 h-5 text-navy" />
                    <div>
                      <p className="font-medium text-navy">Cards, UPI & Netbanking</p>
                      <p className="text-xs text-muted">Secure payment via Razorpay</p>
                    </div>
                  </label>
                  )}
                  {payOpts.cod && (
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
                  <button data-testid="to-review-btn" disabled={!payOpts.online && !payOpts.cod} onClick={() => setStep(3)} className="flex-1 bg-navy text-white rounded px-6 py-3 font-medium">Review order</button>
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
                    className="flex-1 bg-action hover:bg-action-hover text-white rounded px-6 py-3 font-bold disabled:opacity-60 shadow-premium inline-flex items-center justify-center gap-2"
                  >
                    {placing && <BrandLoader size="sm" />}
                    {placing ? "Placing..." : `Place order • ${formatINR(totals.total)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          <aside className="bg-white rounded-lg p-6 shadow-soft h-fit lg:sticky lg:top-[calc(var(--hdr-h,0px)+16px)] transition-[top] duration-300 border border-navy/5">
            <h3 className="font-display text-lg text-navy mb-4">Order summary</h3>
            <ul className="divide-y divide-navy/5">
              {lines.map((l) => (
                <li key={l.variant_id} className="py-3 flex gap-3">
                  <div className="relative w-14 h-14 rounded-md overflow-hidden bg-cream shrink-0">
                    {l.image && <Image src={l.image} alt={l.product_name} fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy line-clamp-2">{l.product_name}</p>
                    <p className="text-xs text-muted">{l.variant_label} × {l.quantity}</p>
                  </div>
                  <p className="text-sm text-navy font-bold">{formatINR(l.price * l.quantity)}</p>
                </li>
              ))}
            </ul>

            {/* Coupon input — matches PDP coupon chip style */}
            <div className="mt-4 rounded-lg border border-dashed border-gold/40 bg-gold/5 p-3">
              <p className="text-[11px] uppercase tracking-widest text-navy font-bold mb-2">Have a coupon?</p>
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 bg-white border border-navy/10 rounded-md px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 uppercase"
                  data-testid="coupon-input"
                />
                <button
                  onClick={applyCoupon}
                  className="bg-navy text-white rounded-md px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity"
                  data-testid="coupon-apply"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-white border border-gold rounded-full pl-3 pr-2 py-1 text-xs font-bold text-navy" data-testid="coupon-applied-chip">
                  {appliedCoupon}
                  <button aria-label="Remove coupon" onClick={() => { setAppliedCoupon(null); setCouponInput(""); }} className="opacity-60 hover:opacity-100">
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-1.5 text-sm">
              <Row l="Subtotal" v={formatINR(totals.subtotal)} />
              {totals.discount > 0 && <Row l={`Coupon${appliedCoupon ? ` (${appliedCoupon})` : ""}`} v={`− ${formatINR(totals.discount)}`} />}
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

function Field({ label, value, onChange, onBlur, testid, type = "text", autoComplete, inputMode, maxLength = 200 }: { label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; testid?: string; type?: string; autoComplete?: string; inputMode?: "numeric" | "email" | "tel" | "text"; maxLength?: number }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-navy font-bold">{label}</span>
      <input
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        data-testid={testid}
        className="mt-1 w-full bg-cream border border-navy/10 rounded-md px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 focus:bg-white transition-all"
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
