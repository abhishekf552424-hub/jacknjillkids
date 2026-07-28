import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PincodeClient from "./PincodeClient";

export const metadata = { title: "Pincode Management - Admin" };

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?redirect=/admin/pincodes");
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!p || !["super_admin", "content_manager"].includes(p.role)) redirect("/");
  return user;
}

export default async function PincodesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: pincodes } = await supabase.from("pincodes").select("*").order("pincode");
  return <PincodeClient initial={pincodes ?? []} />;
}
