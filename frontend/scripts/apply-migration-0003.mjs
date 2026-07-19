// Applies the newest migration (0003_admin_security.sql) via Supabase Postgres pooler.
// Usage: DB_PASSWORD='...' node scripts/apply-migration-0003.mjs
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
const { Client } = pg;

const PWD = process.env.DB_PASSWORD;
if (!PWD) { console.error("Set DB_PASSWORD"); process.exit(1); }

const ROOT = path.resolve(process.cwd(), "..");
const FILE = process.argv[2] || path.join(ROOT, "supabase/migrations/0003_admin_security.sql");
const sql = fs.readFileSync(FILE, "utf8");

const REGIONS = [
  "aws-1-ap-south-1", "aws-0-ap-south-1",
  "aws-1-ap-southeast-1", "aws-0-ap-southeast-1",
];

for (const r of REGIONS) {
  const host = `${r}.pooler.supabase.com`;
  try {
    const c = new Client({ host, port: 6543, database: "postgres", user: "postgres.wtbgdxjupdctncopwvek", password: PWD, ssl: { rejectUnauthorized: false } });
    await c.connect();
    console.log("connected via", r);
    await c.query(sql);
    console.log("applied", path.basename(FILE));
    await c.end();
    process.exit(0);
  } catch (e) {
    console.log("fail", r, e.message.slice(0, 200));
  }
}
process.exit(1);
