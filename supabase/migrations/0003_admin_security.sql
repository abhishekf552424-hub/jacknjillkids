-- 0003_admin_security.sql
-- Phase 1: Admin OTP 2FA + admin user management.
-- Idempotent — safe to re-run.

-- ============================================================
-- profiles: extra flags for admin lifecycle & COD abuse
-- ============================================================
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists cod_blocked boolean not null default false;
alter table public.profiles add column if not exists phone text;

-- ============================================================
-- admin_otp_codes: 6-digit codes emailed to admins on login
-- ============================================================
create table if not exists public.admin_otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null default 'admin_login' check (purpose in ('admin_login','cod_checkout','password_reset')),
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  max_attempts int not null default 5,
  consumed boolean not null default false,
  ip text,
  created_at timestamptz not null default now()
);
create index if not exists idx_admin_otp_user on public.admin_otp_codes(user_id, consumed, purpose);
create index if not exists idx_admin_otp_expires on public.admin_otp_codes(expires_at);

alter table public.admin_otp_codes enable row level security;
drop policy if exists "admin_otp_service" on public.admin_otp_codes;
create policy "admin_otp_service" on public.admin_otp_codes for all using (public.is_admin(auth.uid()));

-- Rate-limit view helper: count of otp requests in last 10min per user+purpose
create or replace view public.admin_otp_recent as
  select user_id, purpose, count(*)::int as recent_count
  from public.admin_otp_codes
  where created_at > now() - interval '10 minutes'
  group by user_id, purpose;

-- ============================================================
-- admin_invites: super_admin invites a new admin
-- ============================================================
create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('super_admin','order_manager','content_manager')),
  token text not null unique,
  expires_at timestamptz not null,
  invited_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_admin_invites_email on public.admin_invites(lower(email));
alter table public.admin_invites enable row level security;
drop policy if exists "admin_invites_super" on public.admin_invites;
create policy "admin_invites_super" on public.admin_invites for all using (public.is_super_admin(auth.uid()));

-- ============================================================
-- product_bundles: combo products
-- ============================================================
alter table public.products add column if not exists product_type text not null default 'simple' check (product_type in ('simple','combo'));
alter table public.products add column if not exists hsn_code text;
alter table public.products add column if not exists eligible_coupon_codes text[] default '{}';

create table if not exists public.product_bundles (
  id uuid primary key default gen_random_uuid(),
  bundle_product_id uuid not null references public.products(id) on delete cascade,
  child_product_id uuid not null references public.products(id) on delete restrict,
  child_variant_id uuid references public.product_variants(id) on delete set null,
  quantity int not null default 1,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_bundle_parent on public.product_bundles(bundle_product_id);
alter table public.product_bundles enable row level security;
drop policy if exists "bundles_public_read" on public.product_bundles;
create policy "bundles_public_read" on public.product_bundles for select using (true);
drop policy if exists "bundles_admin_write" on public.product_bundles;
create policy "bundles_admin_write" on public.product_bundles for all using (public.is_admin(auth.uid()));

-- ============================================================
-- stock_notifications: back-in-stock alerts
-- ============================================================
create table if not exists public.stock_notifications (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  email text not null,
  phone text,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_stock_notif_variant on public.stock_notifications(product_variant_id) where notified_at is null;
alter table public.stock_notifications enable row level security;
drop policy if exists "stock_notif_public_insert" on public.stock_notifications;
create policy "stock_notif_public_insert" on public.stock_notifications for insert with check (true);
drop policy if exists "stock_notif_admin_all" on public.stock_notifications;
create policy "stock_notif_admin_all" on public.stock_notifications for all using (public.is_admin(auth.uid()));

-- ============================================================
-- review_images: photo reviews
-- ============================================================
alter table public.reviews add column if not exists is_approved boolean not null default false;
create table if not exists public.review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  url text not null,
  sort_order int not null default 0
);
alter table public.review_images enable row level security;
drop policy if exists "rev_img_public_read" on public.review_images;
create policy "rev_img_public_read" on public.review_images for select using (true);
drop policy if exists "rev_img_owner_admin" on public.review_images;
create policy "rev_img_owner_admin" on public.review_images for all using (public.is_admin(auth.uid()) or exists(select 1 from public.reviews r where r.id = review_images.review_id and r.user_id = auth.uid()));

-- ============================================================
-- returns: distinguish size_exchange
-- ============================================================
alter table public.returns add column if not exists exchange_variant_id uuid references public.product_variants(id);
alter table public.returns add column if not exists exchange_type text;

-- ============================================================
-- support_tickets
-- ============================================================
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  subject text not null,
  order_id uuid references public.orders(id),
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_role text not null check (author_role in ('customer','admin')),
  author_id uuid references auth.users(id),
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
drop policy if exists "tickets_owner" on public.support_tickets;
create policy "tickets_owner" on public.support_tickets for all using (auth.uid() = user_id or public.is_admin(auth.uid()));
drop policy if exists "ticket_msg_owner" on public.support_ticket_messages;
create policy "ticket_msg_owner" on public.support_ticket_messages for all using (public.is_admin(auth.uid()) or exists(select 1 from public.support_tickets t where t.id = support_ticket_messages.ticket_id and t.user_id = auth.uid()));

-- ============================================================
-- addresses: label for saved addresses
-- ============================================================
alter table public.addresses add column if not exists label text;

-- ============================================================
-- orders: gift wrap + WhatsApp phone
-- ============================================================
alter table public.orders add column if not exists gift_wrap boolean not null default false;
alter table public.orders add column if not exists gift_message text;

-- ============================================================
-- coupons: link to specific products
-- ============================================================
alter table public.coupons add column if not exists highlighted_product_ids uuid[] default '{}';

-- ============================================================
-- wishlist share tokens
-- ============================================================
alter table public.wishlists add column if not exists share_token text unique;

-- ============================================================
-- homepage: promo popup lives in settings as a JSON row
-- ============================================================
-- (no schema change; stored via settings key = 'promo_popup')

-- ============================================================
-- backfill: ensure existing reviews are approved so nothing disappears
-- ============================================================
update public.reviews set is_approved = true where is_approved is not true;
