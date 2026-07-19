"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Shield, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setHint(j.hint || "");
      setStep("otp");
      toast.success("OTP sent to your email");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: otp }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Invalid code");

      // Establish real Supabase session by verifying the returned magic-link hash
      const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: j.token_hash });
      if (error) throw new Error(error.message);

      toast.success("Welcome back");
      router.push("/admin");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-navy px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1 mb-3">
            <span className="font-display text-3xl font-bold text-navy">Jack</span>
            <span className="font-display text-3xl font-bold text-gold">&amp;</span>
            <span className="font-display text-3xl font-bold text-navy">Jill</span>
          </div>
          <p className="text-xs uppercase tracking-widest text-gold font-bold">Admin</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500">
            <Shield className="w-3.5 h-3.5" /> Two-factor secured
          </div>
        </div>

        {step === "credentials" ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-neutral-600">Email</span>
              <div className="mt-1 flex items-center rounded-lg border border-neutral-200 focus-within:border-navy">
                <Mail className="w-4 h-4 mx-3 text-neutral-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 bg-transparent py-3 outline-none text-sm" placeholder="you@example.com" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-neutral-600">Password</span>
              <div className="mt-1 flex items-center rounded-lg border border-neutral-200 focus-within:border-navy">
                <Lock className="w-4 h-4 mx-3 text-neutral-400" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 bg-transparent py-3 outline-none text-sm" />
              </div>
            </label>
            <button disabled={loading} className="w-full bg-navy text-white rounded-lg py-3 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? "Sending code..." : (<><span>Continue</span><ArrowRight className="w-4 h-4" /></>)}
            </button>
            <p className="text-center text-xs text-neutral-400">
              <Link href="/" className="hover:text-navy">← Back to store</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-sm text-neutral-600 text-center">{hint || "Enter the 6-digit code from your email."}</p>
            <input
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center text-3xl tracking-[0.6em] font-display border border-neutral-200 rounded-lg py-4 focus:outline-none focus:border-navy"
              placeholder="000000"
              autoFocus
            />
            <button disabled={loading || otp.length !== 6} className="w-full bg-navy text-white rounded-lg py-3 text-sm font-medium disabled:opacity-50">
              {loading ? "Verifying..." : "Verify & sign in"}
            </button>
            <button type="button" onClick={() => { setStep("credentials"); setOtp(""); }} className="w-full text-xs text-neutral-500 hover:text-navy">
              Use a different account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
