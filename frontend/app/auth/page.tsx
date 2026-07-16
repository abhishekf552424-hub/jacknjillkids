"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, User as UserIcon } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Account created! Please check email to verify (if required).");
        router.push("/account");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        router.push("/account");
      }
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const otpSend = async () => {
    if (!email) return toast.error("Enter your email first");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("OTP link sent — check your inbox.");
  };

  return (
    <div className="container py-16 min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-soft p-8">
        <p className="text-xs uppercase tracking-widest text-gold font-bold text-center">Welcome</p>
        <h1 className="mt-2 font-display text-3xl text-navy text-center tracking-tight">
          {mode === "login" ? "Sign in to Jack & Jill" : "Create your account"}
        </h1>

        <form onSubmit={submit} className="mt-8 space-y-4" data-testid="auth-form">
          {mode === "register" && (
            <div className="relative">
              <UserIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                data-testid="auth-name"
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-cream rounded border border-navy/10 focus:border-gold outline-none text-sm"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              data-testid="auth-email"
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-3 bg-cream rounded border border-navy/10 focus:border-gold outline-none text-sm"
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              data-testid="auth-password"
              required
              type="password"
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 bg-cream rounded border border-navy/10 focus:border-gold outline-none text-sm"
            />
          </div>
          <button
            data-testid="auth-submit"
            disabled={loading}
            className="w-full bg-navy text-white rounded py-3 font-medium disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-navy/10" /></div>
          <span className="relative bg-white px-3 text-xs text-muted uppercase tracking-widest">or</span>
        </div>

        <button onClick={otpSend} disabled={loading} className="w-full border-2 border-gold text-gold rounded py-3 font-medium hover:bg-gold hover:text-white transition-all">
          Email me a magic link
        </button>

        <p className="mt-6 text-center text-sm text-muted">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            data-testid="auth-toggle"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-gold underline"
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
        <p className="mt-3 text-center text-xs text-muted">
          By continuing you agree to our <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
