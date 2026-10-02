// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";

import { canAccess, assignableRoles, SECTION_ROLES, ALL_ADMIN_ROLES } from "../lib/admin-roles";
import { canManage, canAssign } from "../lib/admin-team";
import { computeDashboard, rangeWindow, istDayStart, bucketKey, isSale, withoutMoney, pctChange, type OrderRow } from "../lib/admin-analytics";

test("roles: staff gets orders + stock only, owner gets the shop, developer gets all", () => {
  for (const s of ["dashboard", "orders", "returns", "support", "stock"] as const) assert.equal(canAccess("staff", s), true, s);
  for (const s of ["products", "categories", "coupons", "homepage", "cms", "reviews", "customers", "reports", "settings", "team"] as const) {
    assert.equal(canAccess("staff", s), false, `staff must not open ${s}`);
    assert.equal(canAccess("owner", s), true, `owner opens ${s}`);
  }
  for (const s of Object.keys(SECTION_ROLES) as (keyof typeof SECTION_ROLES)[]) assert.equal(canAccess("super_admin", s), true);
  assert.equal(canAccess("customer", "dashboard"), false);
  assert.equal(canAccess("order_manager", "orders"), false, "old role names no longer work");
  assert.deepEqual(ALL_ADMIN_ROLES, ["super_admin", "owner", "staff"]);
});

test("team rules: no self-changes, owner can't touch the developer", () => {
  const owner = { id: "o1", role: "owner" as const };
  const dev = { id: "d1", role: "super_admin" as const };
  assert.ok(canManage(owner, { id: "o1", role: "owner" }), "self change blocked");
  assert.ok(canManage(owner, { id: "d1", role: "super_admin" }), "owner cannot manage developer");
  assert.equal(canManage(owner, { id: "s1", role: "staff" }), null);
  assert.equal(canManage(owner, { id: "o2", role: "owner" }), null);
  assert.equal(canManage(dev, { id: "o1", role: "owner" }), null);
  assert.ok(canManage(dev, { id: "c1", role: "customer" }), "customers are not team members");
  assert.equal(canAssign("owner", "super_admin"), false);
  assert.equal(canAssign("owner", "staff"), true);
  assert.equal(canAssign("staff", "staff"), false);
  assert.equal(canAssign("super_admin", "super_admin"), true);
  assert.equal(canAssign("owner", "admin"), false);
  assert.deepEqual(assignableRoles("staff"), []);
});

test("IST day boundaries", () => {
  // 2026-10-03 00:30 IST = 2026-10-02 19:00 UTC
  const d = new Date("2026-10-02T19:00:00Z");
  assert.equal(istDayStart(d).toISOString(), "2026-10-02T18:30:00.000Z");
  assert.equal(bucketKey(d, "day"), "2026-10-03");
  assert.equal(bucketKey(d, "hour"), "00");
});

test("sale rules: COD and paid count; unpaid, cancelled, refunded don't", () => {
  assert.equal(isSale({ status: "placed", payment_status: "cod" }), true);
  assert.equal(isSale({ status: "confirmed", payment_status: "paid" }), true);
  assert.equal(isSale({ status: "placed", payment_status: "pending" }), false);
  assert.equal(isSale({ status: "cancelled", payment_status: "failed" }), false);
  assert.equal(isSale({ status: "cancelled", payment_status: "cod" }), false);
  assert.equal(isSale({ status: "refunded", payment_status: "refunded" }), false);
});

test("dashboard totals, buckets, comparison and staff view", () => {
  const now = new Date("2026-10-03T12:00:00Z"); // 17:30 IST
  const w = rangeWindow("7d", now);
  assert.equal(w.days, 7);
  assert.equal(w.from.toISOString(), "2026-09-26T18:30:00.000Z"); // 27 Sep 00:00 IST
  const o = (at: string, total: number, status: string, pay: string, method: string, items: [string, number, number][] = []): OrderRow => ({
    id: at + total,
    total,
    status,
    payment_status: pay,
    payment_method: method,
    created_at: at,
    items: items.map(([product_name, quantity, price_at_purchase]) => ({ product_name, quantity, price_at_purchase })),
  });
  const current = [
    o("2026-10-03T05:00:00Z", 1000, "placed", "cod", "cod", [["Frock", 2, 500]]),
    o("2026-10-02T20:00:00Z", 500.5, "shipped", "paid", "razorpay", [["Frock", 1, 500.5]]), // 3 Oct 01:30 IST
    o("2026-10-01T10:00:00Z", 800, "placed", "pending", "razorpay", [["Shorts", 1, 800]]), // unpaid
    o("2026-09-30T10:00:00Z", 300, "cancelled", "cod", "cod"),
    o("2026-09-20T10:00:00Z", 999, "delivered", "paid", "razorpay"), // outside window
  ];
  const previous = [o("2026-09-22T10:00:00Z", 750.25, "delivered", "paid", "razorpay"), o("2026-09-23T10:00:00Z", 99, "placed", "pending", "razorpay")];
  const s = computeDashboard(w, current, previous);
  assert.equal(s.kpis.sales, 1500.5);
  assert.equal(s.kpis.orders, 2);
  assert.equal(s.kpis.aov, 750.25);
  assert.equal(s.kpis.itemsSold, 3);
  assert.equal(s.kpis.salesPrev, 750.25);
  assert.equal(s.kpis.ordersPrev, 1);
  assert.equal(s.kpis.salesChange, 100);
  assert.equal(s.series.length, 7);
  const oct3 = s.series.find((p) => p.key === "2026-10-03");
  assert.deepEqual([oct3?.orders, oct3?.sales, oct3?.label], [2, 1500.5, "3 Oct"]);
  assert.deepEqual(s.payment, { cod: { orders: 1, sales: 1000 }, online: { orders: 1, sales: 500.5 } });
  assert.deepEqual(s.statusCounts, { placed: 2, shipped: 1, cancelled: 1 });
  assert.deepEqual(s.topProducts, [{ name: "Frock", qty: 3, revenue: 1500.5 }]);

  const staff = withoutMoney(s);
  assert.equal(staff.kpis.sales, 0);
  assert.equal(staff.kpis.orders, 2);
  assert.ok(staff.series.every((p) => p.sales === 0));
  assert.equal(staff.topProducts[0].revenue, 0);
  assert.equal(JSON.stringify(staff).includes("1500.5"), false, "no money figure leaks to staff");
});

test("today range uses 24 hourly buckets", () => {
  const w = rangeWindow("today", new Date("2026-10-03T12:00:00Z"));
  const s = computeDashboard(w, [], []);
  assert.equal(s.series.length, 24);
  assert.equal(s.series[0].label, "12am");
  assert.equal(s.series[13].label, "1pm");
  assert.equal(pctChange(0, 0), 0);
  assert.equal(pctChange(5, 0), null);
});
