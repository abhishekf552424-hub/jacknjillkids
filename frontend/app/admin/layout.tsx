import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role === "customer") redirect("/account");
  if (profile.is_active === false) {
    // Sign out and bounce to login
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  // Require the 2FA cookie set by /api/admin/auth/verify-otp
  const jar = await cookies();
  const twoFaOk = jar.get("admin_2fa_ok")?.value === "1";
  if (!twoFaOk) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return (
    <AdminShell role={profile.role} name={profile.full_name || user.email || ""}>
      {children}
    </AdminShell>
  );
}
