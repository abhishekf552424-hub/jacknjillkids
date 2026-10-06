import { test } from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";

test("coming-soon bypass accepts only a real, unexpired admin 2FA cookie", async () => {
  const { signValue } = await import("@/lib/admin-auth");
  const { isAdminRequestCookie } = await import("@/lib/site-mode");
  const now = Math.floor(Date.now() / 1000);
  const good = signValue({ k: "2fa", uid: "u1", exp: now + 3600 });
  assert.equal(await isAdminRequestCookie(good), true);
  // tampered body
  const [body, tag] = [good.slice(0, good.lastIndexOf(".")), good.slice(good.lastIndexOf(".") + 1)];
  const forged = Buffer.from(JSON.stringify({ k: "2fa", uid: "u2", exp: now + 3600 })).toString("base64url") + "." + tag;
  assert.equal(await isAdminRequestCookie(forged), false);
  assert.equal(await isAdminRequestCookie(body + ".AAAA"), false);
  // expired, wrong kind, empty
  assert.equal(await isAdminRequestCookie(signValue({ k: "2fa", uid: "u1", exp: now - 5 })), false);
  assert.equal(await isAdminRequestCookie(signValue({ k: "ch", uid: "u1", exp: now + 3600 })), false);
  assert.equal(await isAdminRequestCookie(undefined), false);
  assert.equal(await isAdminRequestCookie("not-a-cookie"), false);
});
