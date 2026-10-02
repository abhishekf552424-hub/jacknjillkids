/**
 * Admin roles and what each one may open (same model as Purasatva).
 * Safe to import from client components — no server code here.
 *
 *   super_admin  developer: everything, incl. payment keys and tracking codes
 *   owner        shop owner: runs the whole shop, manages staff
 *   staff        orders, returns, customer queries and stock only
 */
export type AdminRole = "super_admin" | "owner" | "staff";
export const ALL_ADMIN_ROLES: AdminRole[] = ["super_admin", "owner", "staff"];

/** Owner-level access (owner + developer). */
export const MANAGERS: AdminRole[] = ["super_admin", "owner"];
export const DEVELOPER: AdminRole[] = ["super_admin"];

export const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "Developer (super admin)",
  owner: "Owner",
  staff: "Staff",
};

export const ROLE_HELP: Record<AdminRole, string> = {
  super_admin: "Everything, including payment keys and tracking codes. Only for the website developer.",
  owner: "Runs the whole shop: orders, products, prices, offers, website content, reports, settings and staff.",
  staff: "Orders, returns, customer queries and stock only. Cannot see sales totals, change prices or settings.",
};

export function isAdminRole(r: unknown): r is AdminRole {
  return typeof r === "string" && (ALL_ADMIN_ROLES as string[]).includes(r);
}

/**
 * Which roles may open each admin section. The sidebar, the page guards and
 * the API guards all read this, so they can never disagree.
 */
export const SECTION_ROLES = {
  dashboard: ALL_ADMIN_ROLES,
  orders: ALL_ADMIN_ROLES,
  returns: ALL_ADMIN_ROLES,
  support: ALL_ADMIN_ROLES,
  stock: ALL_ADMIN_ROLES,
  products: MANAGERS,
  categories: MANAGERS,
  coupons: MANAGERS,
  homepage: MANAGERS,
  cms: MANAGERS,
  reviews: MANAGERS,
  customers: MANAGERS,
  reports: MANAGERS,
  settings: MANAGERS,
  team: MANAGERS,
} satisfies Record<string, AdminRole[]>;

export type AdminSection = keyof typeof SECTION_ROLES;

export function canAccess(role: string | null | undefined, section: AdminSection): boolean {
  return isAdminRole(role) && (SECTION_ROLES[section] as AdminRole[]).includes(role);
}

/** Roles a person with `actor` role may give to someone else. */
export function assignableRoles(actor: AdminRole): AdminRole[] {
  return actor === "super_admin" ? ["super_admin", "owner", "staff"] : actor === "owner" ? ["owner", "staff"] : [];
}

/** Settings keys only the developer may change (secrets / code-level). */
export const DEVELOPER_ONLY_SETTINGS = new Set(["razorpay", "tracking"]);
