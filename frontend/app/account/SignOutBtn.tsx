"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function SignOutBtn() {
  const router = useRouter();
  const supabase = createClient();
  return (
    <button
      data-testid="signout-btn"
      onClick={async () => {
        await supabase.auth.signOut();
        // also end any admin access on this browser (httpOnly cookie: only the server can clear it)
        await fetch("/api/admin/auth/logout", { method: "POST" }).catch(() => {});
        router.push("/");
        router.refresh();
      }}
      className="border border-navy/10 text-navy rounded px-4 py-2 text-sm font-medium hover:bg-navy hover:text-white transition-colors flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" /> Sign out
    </button>
  );
}
