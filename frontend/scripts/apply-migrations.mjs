// Runs both migrations against Supabase Postgres.
// Usage: DB_PASSWORD='...' node scripts/apply-migrations.mjs
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "wtbgdxjupdctncopwvek";
const PASSWORD = process.env.DB_PASSWORD;
if (!PASSWORD) { console.error("Set DB_PASSWORD env var"); process.exit(1); }

const ROOT = path.resolve(process.cwd(), "..");
const files = [
  path.join(ROOT, "supabase/migrations/0001_init.sql"),
  path.join(ROOT, "supabase/migrations/0002_seed.sql"),
];

const REGIONS = [
  "aws-1-ap-south-1",
  "aws-1-ap-southeast-1",
  "aws-1-us-east-1",
  "aws-1-us-east-2",
  "aws-1-us-west-1",
  "aws-1-eu-central-1",
  "aws-1-eu-west-2",
  "aws-0-ap-south-1",
  "aws-0-ap-southeast-1",
  "aws-0-us-east-1",
  "aws-0-us-east-2",
  "aws-0-us-west-1",
  "aws-0-eu-central-1",
];

async function tryConnect() {
  // Try direct db.<ref>.supabase.co first
  const direct = {
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    user: "postgres",
    password: PASSWORD,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  };
  try {
    const c = new Client({ ...direct, connectionTimeoutMillis: 6000 });
    await c.connect();
    return c;
  } catch (e) {
    console.error("Direct failed:", e.message);
  }
  for (const region of REGIONS) {
    try {
      const c = new Client({
        host: `${region}.pooler.supabase.com`,
        port: 6543,
        user: `postgres.${PROJECT_REF}`,
        password: PASSWORD,
        database: "postgres",
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 6000,
      });
      await c.connect();
      console.log(`Connected via pooler: ${region}`);
      return c;
    } catch (e) {
      console.error(`Pooler ${region} failed: ${e.message}`);
    }
  }
  throw new Error("Could not connect to any Supabase endpoint");
}

const c = await tryConnect();
for (const f of files) {
  const sql = fs.readFileSync(f, "utf8");
  console.log(`\n=== Applying ${path.basename(f)} (${sql.length} chars) ===`);
  try {
    await c.query(sql);
    console.log("OK");
  } catch (e) {
    console.error(`Error in ${f}:`, e.message);
    throw e;
  }
}
await c.end();
console.log("\nAll migrations applied.");
