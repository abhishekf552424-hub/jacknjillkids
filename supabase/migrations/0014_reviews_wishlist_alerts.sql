-- =========================================================================
-- 0014 — Reviews, wishlist and back-in-stock alerts (safe to re-run)
--
-- Reviews: customers write reviews through /api/reviews only (server checks
--   login, one review per product, "verified buyer"). The old policy let any
--   signed-in user insert straight into the table — even as already approved.
-- Alerts: "Notify me" now also works for products that have no size yet, and
--   only the server can add rows (the public insert policy allowed spam).
-- Wishlist: table already exists with an owner-only policy; add an index.
-- =========================================================================

-- Reviews ----------------------------------------------------------------
drop policy if exists "reviews_insert" on public.reviews;
alter table public.reviews add column if not exists is_verified boolean not null default false;
create unique index if not exists reviews_one_per_user
  on public.reviews (product_id, user_id) where user_id is not null;

-- Back-in-stock alerts --------------------------------------------------
alter table public.stock_notifications alter column product_variant_id drop not null;
alter table public.stock_notifications
  add column if not exists product_id uuid references public.products(id) on delete cascade;
update public.stock_notifications n
   set product_id = v.product_id
  from public.product_variants v
 where n.product_id is null and v.id = n.product_variant_id;
create index if not exists idx_stock_notif_product on public.stock_notifications (product_id) where notified_at is null;
create unique index if not exists stock_notif_once
  on public.stock_notifications (product_id, lower(email)) where notified_at is null;
drop policy if exists "stock_notif_public_insert" on public.stock_notifications;

-- Wishlist ----------------------------------------------------------------
create index if not exists wishlists_user_idx on public.wishlists (user_id, created_at desc);
