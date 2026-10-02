import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "./AdminShell";
import { TWO_FA_COOKIE, isTwoFaCookieValid } from "@/lib/admin-auth";
import { getBrandSettings } from "@/lib/settings";
import { isAdminRole } from "@/lib/admin-roles";

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
  if (!profile || !isAdminRole(profile.role)) redirect("/account");
  if (profile.is_active === false) {
    // Sign out and bounce to login
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  // Require the 2FA cookie set by /api/admin/auth/verify-otp
  const jar = await cookies();
  const twoFaOk = isTwoFaCookieValid(jar.get(TWO_FA_COOKIE)?.value, user.id);
  if (!twoFaOk) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  // Same brand settings used by the public Header — single source of truth.
  const brand = await getBrandSettings();

  return (
    <AdminShell role={profile.role} name={profile.full_name || user.email || ""} logoUrl={brand.logo_url} logoSize={brand.logo_size}>
      {children}
    </AdminShell>
  );
}
