// Seed the primary super_admins.
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

const env = loadEnv();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const seeds = [
  ["samfonde0@gmail.com", "#Sam@508050", "Sam Fonde"],
  ["admin@jacknjillkids.com", "AdminJJ@2026!", "Jack & Jill Admin"],
];

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
