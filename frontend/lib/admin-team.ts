import type { SupabaseClient } from "@supabase/supabase-js";
import { assignableRoles, isAdminRole, type AdminRole } from "@/lib/admin-roles";

/**
 * Who may manage whom on the Team page:
 *  - nobody changes their own role / access (prevents locking yourself out),
 *  - the owner manages owners and staff, never the developer account,
 *  - the developer manages everyone.
 */
export function canManage(actor: { id: string; role: AdminRole }, target: { id: string; role: string }): string | null {
  if (actor.id === target.id) return "You can't change your own access. Ask another owner or the developer.";
  if (!isAdminRole(target.role)) return "This person is not on the team.";
  if (!assignableRoles(actor.role).includes(target.role)) return "Only the developer can change this account.";
  return null;
}

export function canAssign(actor: AdminRole, role: unknown): role is AdminRole {
  return isAdminRole(role) && assignableRoles(actor).includes(role);
}

/** Finds an auth user id by email (Supabase lists users page by page). */
export async function findUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  const target = email.trim().toLowerCase();
  const { data: prof } = await admin.from("profiles").select("id").ilike("email", target).maybeSingle();
  if (prof?.id) return prof.id as string;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) return null;
    const hit = data.users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}
