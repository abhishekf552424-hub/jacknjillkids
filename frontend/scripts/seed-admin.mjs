// Create an admin user in Supabase Auth and set their profile role to super_admin.
// Usage: node scripts/seed-admin.mjs <email> <password>
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const email = process.argv[2] || "admin@jacknjillkids.com";
const password = process.argv[3] || "AdminJJ@2026!";
const fullName = process.argv[4] || "Jack & Jill Admin";

// Load env
const envPath = path.resolve(process.cwd(), ".env.local");
const env = Object.fromEntries(fs.readFileSync(envPath, "utf8").split("\n").filter(Boolean).map((l) => l.split("=")));

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Create user
let userId = null;
const { data: created, error: cErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
});
if (cErr && !String(cErr.message).toLowerCase().includes("already")) {
  console.error("Create user error:", cErr.message);
  process.exit(1);
}
if (created?.user) {
  userId = created.user.id;
  console.log("Created user:", email);
} else {
  const { data: list } = await admin.auth.admin.listUsers();
  const u = list.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
  userId = u?.id;
  console.log("User exists:", email);
}

if (!userId) {
  console.error("Could not resolve user ID");
  process.exit(1);
}

// Ensure profile
await admin.from("profiles").upsert({
  id: userId,
  email,
  full_name: fullName,
  role: "super_admin",
});
console.log("Set role: super_admin");

// Sample coupon
await admin.from("coupons").upsert({ code: "WELCOME10", type: "percent", value: 10, min_cart_value: 500, per_user_limit: 1, is_active: true }, { onConflict: "code" });
console.log("\nAdmin login:");
console.log("  Email:   ", email);
console.log("  Password:", password);
console.log("  Admin URL:", (env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") + "/admin");
