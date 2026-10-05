// Run: npm test  (node --test via tsx)
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-role-key";

import { isValidCheckoutSignature, isValidWebhookSignature, safeEqual, toPaise } from "../lib/payments";
import { makeTwoFaCookie, isTwoFaCookieValid, makeChallengeCookie, readChallengeCookie, signValue, readSignedValue } from "../lib/admin-auth";
import { makeOrderAccessToken, isValidOrderAccessToken } from "../lib/order-access";
import { computeDiscount, computeTotals } from "../lib/coupons";

const hmac = (k: string, p: string) => crypto.createHmac("sha256", k).update(p).digest("hex");

test("razorpay checkout signature: accepts genuine, rejects tampered", () => {
  const secret = "rzp_secret";
  const sig = hmac(secret, "order_A|pay_1");
  assert.equal(isValidCheckoutSignature(secret, "order_A", "pay_1", sig), true);
  assert.equal(isValidCheckoutSignature(secret, "order_B", "pay_1", sig), false);
  assert.equal(isValidCheckoutSignature(secret, "order_A", "pay_2", sig), false);
  assert.equal(isValidCheckoutSignature("", "order_A", "pay_1", sig), false);
});

test("razorpay webhook signature over raw body", () => {
  const body = JSON.stringify({ event: "payment.captured" });
  assert.equal(isValidWebhookSignature("wh", body, hmac("wh", body)), true);
  assert.equal(isValidWebhookSignature("wh", body + " ", hmac("wh", body)), false);
  assert.equal(isValidWebhookSignature("", body, hmac("", body)), false);
});

test("safeEqual handles length mismatch and empty", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abcd"), false);
  assert.equal(safeEqual("", ""), false);
});

test("toPaise avoids float drift", () => {
  assert.equal(toPaise(1049.99), 104999);
  assert.equal(toPaise("899.10"), 89910);
});

test("2FA cookie: bound to user, not forgeable, expires", () => {
  const c = makeTwoFaCookie("user-1");
  assert.equal(isTwoFaCookieValid(c, "user-1"), true);
  assert.equal(isTwoFaCookieValid(c, "user-2"), false, "cookie must not work for another user");
  assert.equal(isTwoFaCookieValid("1", "user-1"), false, "old literal '1' cookie must be rejected");
  const [body] = c.split(".");
  const forged = Buffer.from(JSON.stringify({ k: "2fa", uid: "user-2", exp: 9e9 })).toString("base64url");
  assert.equal(isTwoFaCookieValid(`${forged}.${c.split(".")[1]}`, "user-2"), false, "re-used tag on new body");
  assert.ok(body);
  const expired = signValue({ k: "2fa", uid: "user-1", exp: Math.floor(Date.now() / 1000) - 1 });
  assert.equal(isTwoFaCookieValid(expired, "user-1"), false);
});

test("challenge cookie cannot be swapped for a 2FA cookie or edited", () => {
  const ch = makeChallengeCookie("user-1");
  assert.deepEqual(readChallengeCookie(ch), { uid: "user-1" });
  assert.equal(isTwoFaCookieValid(ch, "user-1"), false);
  assert.equal(readChallengeCookie(JSON.stringify({ uid: "x", email: "boss@x.com" })), null, "old unsigned JSON is rejected");
  assert.equal(readSignedValue(ch.slice(0, -2) + "xx"), null);
});

test("order access token: per order, constant length", () => {
  const t = makeOrderAccessToken("JJ100123");
  assert.equal(t.length, 32);
  assert.equal(isValidOrderAccessToken("JJ100123", t), true);
  assert.equal(isValidOrderAccessToken("JJ100124", t), false);
  assert.equal(isValidOrderAccessToken("JJ100123", undefined), false);
  assert.equal(isValidOrderAccessToken("JJ100123", t.slice(1)), false);
});

test("coupon discount math", () => {
  assert.equal(computeDiscount({ type: "percent", value: 10, max_discount: null }, 1500), 150);
  assert.equal(computeDiscount({ type: "percent", value: 50, max_discount: 300 }, 1500), 300);
  assert.equal(computeDiscount({ type: "flat", value: 200, max_discount: null }, 150), 150, "never more than cart");
});

test("totals: discount reduces taxable amount; free shipping on subtotal", () => {
  const s = { free_above: 999, flat_fee: 79, gst_percent: 5 };
  // prices include GST: the tax is shown, not added
  assert.deepEqual(computeTotals(1000, 100, s), { subtotal: 1000, discount: 100, shipping: 0, tax: 43, total: 900 });
  assert.deepEqual(computeTotals(500, 0, s), { subtotal: 500, discount: 0, shipping: 79, tax: 28, total: 579 });
  // shop that adds GST on top
  assert.deepEqual(computeTotals(1000, 100, { ...s, prices_include_gst: false }), { subtotal: 1000, discount: 100, shipping: 0, tax: 45, total: 945 });
});

import { plpHref } from "../lib/plp-url";

test("listing URLs: category in path, filters in query, page reset", () => {
  assert.equal(plpHref({ category: "clothing" }), "/category/clothing");
  assert.equal(plpHref({ category: "clothing", page: "3" }, { age: "2-4y" }), "/category/clothing?age=2-4y");
  assert.equal(plpHref({ category: "clothing", age: "2-4y" }, { category: null }), "/shop?age=2-4y");
  assert.equal(plpHref({}, { sort: "newest" }), "/shop?sort=newest");
  assert.equal(plpHref({ category: "toys", page: "1" }, { page: "2" }), "/category/toys?page=2");
  assert.equal(plpHref({ min: "100", max: "900" }, { min: null, max: "500" }), "/shop?max=500");
});

import { safeNext } from "../lib/safe-next";

test("sign-in redirect only goes to pages on this site", () => {
  assert.equal(safeNext("/product/frock#reviews"), "/product/frock#reviews");
  assert.equal(safeNext("/account/wishlist"), "/account/wishlist");
  assert.equal(safeNext("//evil.com"), "/account");
  assert.equal(safeNext("/\\evil.com"), "/account");
  assert.equal(safeNext("https://evil.com"), "/account");
  assert.equal(safeNext("javascript:alert(1)"), "/account");
  assert.equal(safeNext(null), "/account");
});

// --- Final audit (Oct 2026) ---
import { safeNext } from "../lib/safe-next";
import { esc, jsonLd } from "../lib/html";
import { pickEditable } from "../lib/pick";

test("login redirect only stays on this site", () => {
  assert.equal(safeNext("/account/orders"), "/account/orders");
  for (const bad of ["//evil.com", "/\t/evil.com", "/\\evil.com", "https://evil.com", "/\n/evil.com"]) assert.equal(safeNext(bad), "/account");
});

test("emails and structured data can't be broken by shop data", () => {
  assert.equal(esc(`<a href="x">Hi</a>`), "&lt;a href=&quot;x&quot;&gt;Hi&lt;/a&gt;");
  assert.ok(!jsonLd({ name: "</script><script>alert(1)</script>" }).includes("</script>"));
});

test("admin saves keep only editable columns", () => {
  const r = pickEditable("coupons", { code: "A1", id: "x", created_at: "y", value: 10 });
  assert.deepEqual(r, { code: "A1", value: 10 });
});
