"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import BrandLoader from "@/components/BrandLoader";

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

  const googleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (e: any) {
      toast.error(e?.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="container py-16 min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-premium p-8 border border-navy/5">
        <p className="text-xs uppercase tracking-widest text-gold font-bold text-center">Welcome</p>
        <h1 className="mt-2 font-display text-3xl text-navy text-center tracking-tight">
          {mode === "login" ? "Sign in to Jack & Jill" : "Create your account"}
        </h1>

        <form onSubmit={submit} className="mt-8 space-y-4" data-testid="auth-form">
          {mode === "register" && (
            <div className="relative">
              <UserIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                data-testid="auth-name"
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-cream rounded-md border border-navy/10 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:bg-white outline-none text-sm transition-all"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              data-testid="auth-email"
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-3 bg-cream rounded-md border border-navy/10 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:bg-white outline-none text-sm transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              data-testid="auth-password"
              required
              type="password"
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 bg-cream rounded-md border border-navy/10 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:bg-white outline-none text-sm transition-all"
            />
          </div>
          <button
            data-testid="auth-submit"
            disabled={loading}
            className="w-full bg-navy text-white rounded-md py-3 font-bold disabled:opacity-60 hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
          >
            {loading && <BrandLoader size="sm" />}
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-navy/10" /></div>
          <span className="relative bg-white px-3 text-xs text-muted uppercase tracking-widest">or</span>
        </div>

        <button onClick={googleSignIn} disabled={loading} className="w-full bg-white border border-navy/20 text-navy rounded-md py-3 font-medium hover:bg-neutral-50 transition-all flex items-center justify-center gap-3">
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-muted">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            data-testid="auth-toggle"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-gold underline font-bold"
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
