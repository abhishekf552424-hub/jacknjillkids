// Seed the primary super_admins.
// Credentials are NEVER stored in the repo. Provide them via the ADMIN_SEEDS env var
// (in .env.local or the shell) as JSON:
//   ADMIN_SEEDS='[{"email":"owner@example.com","password":"<strong password>","full_name":"Owner"}]'
// Usage: node scripts/seed-primary-admins.mjs
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const candidates = [".env.local", ".env"].map((p) => path.resolve(process.cwd(), p));
  const env = {};
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    }
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let seeds = [];
try {
  seeds = JSON.parse(env.ADMIN_SEEDS || "[]").map((s) => [s.email, s.password, s.full_name || "Admin"]);
} catch {
  console.error("ADMIN_SEEDS must be a JSON array of {email, password, full_name}");
  process.exit(1);
}
if (!seeds.length) {
  console.error("No ADMIN_SEEDS provided — nothing to do.");
  process.exit(1);
}
for (const [email, password] of seeds) {
  if (!email || !password || String(password).length < 12) {
    console.error(`Seed for ${email || "(missing email)"} needs a password of at least 12 characters.`);
    process.exit(1);
  }
}

for (const [email, password, full_name] of seeds) {
  let userId = null;
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name },
  });
  if (created?.user) {
    userId = created.user.id;
    console.log("created:", email);
  } else {
    const { data: list } = await admin.auth.admin.listUsers();
    const u = list.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) {
      userId = u.id;
      await admin.auth.admin.updateUserById(u.id, { password, email_confirm: true, user_metadata: { full_name } });
      console.log("updated:", email);
    } else {
      console.error("failed for", email, cErr?.message);
      continue;
    }
  }
  await admin.from("profiles").upsert({ id: userId, email, full_name, role: "super_admin", is_active: true });
  console.log("  role set: super_admin");
}
console.log("\nDone.");
