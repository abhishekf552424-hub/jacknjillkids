# Deploy guide — October 2026 release

This release = security fixes (already in `main`) + order engine/stock + SEO + logo colours and fonts.
**The page layout is unchanged.**

## 1. Supabase (do this FIRST)

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Open `supabase/RUN_BEFORE_DEPLOY_2026-10.sql`, copy the whole file, paste, click **Run**
3. The last table must show **ok** on all 4 rows. If any row says `MISSING`, stop and send a screenshot.
4. Also run this once and check the list — only your real admins should be there:

   ```sql
   select email, role, updated_at from public.profiles where role <> 'customer' order by updated_at desc;
   ```

   If you see an unknown account with an admin role, change it back:
   `update public.profiles set role = 'customer' where email = '<that email>';`

> Why first? The new checkout calls database functions (`place_order` etc.). If the code goes live before this SQL, checkout and online payments will fail.

## 2. Hostinger environment variables

Already there (keep): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MAIL_FROM`, `RAZORPAY_*`

Check / add:

| Name | Value | Why |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://jacknjillkids.com` | canonical links, sitemap, email links |
| `ADMIN_SESSION_SECRET` | any long random text (40+ characters) | signs the admin 2-step login cookie |
| `ORDER_ACCESS_SECRET` | another long random text | signs guest "view my order" links |

Pages are now pre-built, so the Supabase variables must be available at **build time** too (Hostinger normally uses the same variables for build and run).

## 3. Merge and deploy

1. Merge PR #3 on GitHub (after step 1 shows all ok)
2. Hostinger → redeploy / rebuild from `main`
3. All admins log in again (old login cookies are no longer valid — expected)

## 4. Manual test checklist

Use small amounts. Cancel test orders from the admin afterwards (stock comes back automatically).

**Shop**
- [ ] Home, a category page (e.g. `/category/clothing`), a product page open without errors
- [ ] Old link `/shop?category=clothing` jumps to `/category/clothing`
- [ ] Filter by age on a category: count and products look right, pagination works

**Checkout**
- [ ] Guest order with COD → order page opens (no "not found") and email arrives
- [ ] Coupon (e.g. WELCOME10, if active) → discount shows in the summary and on the order
- [ ] Online payment (Razorpay test or ₹1 product) → order becomes Paid/Confirmed; confirmation email arrives only after payment
- [ ] Start an online payment and close the window → after ~45 minutes the order is Cancelled and stock is back
- [ ] Product with stock 1: try buying 2 → clear "sold out" message

**Admin**
- [ ] Login needs password + email code
- [ ] Cancel an order → product stock goes back up
- [ ] Edit a product and Save → a shopper's bag item for that product still works
- [ ] Approve a size exchange → old size +1, new size −1, only once

**SEO**
- [ ] `/sitemap.xml` lists `/category/...` pages; `/robots.txt` shows the sitemap
- [ ] `/feeds/google-shopping.xml` opens (point Google Merchant Center here)

## 5. After launch

- Resubmit `sitemap.xml` in Google Search Console
- Fill each category's SEO title and description in the admin
- Decide GST: the Terms page says prices include GST, but checkout still adds GST on top
