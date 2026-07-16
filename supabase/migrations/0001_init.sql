-- =========================================================================
-- Jack & Jill — Initial Schema
-- Enterprise e-commerce: products, categories, orders, cart, wishlist,
-- reviews, coupons, CMS, homepage sections, admin RBAC, audit logs
-- =========================================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 1. PROFILES (extends auth.users)
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  role text not null default 'customer' check (role in ('customer','super_admin','order_manager','content_manager')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- 2. ADDRESSES
-- =========================================================================
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses(user_id);

-- =========================================================================
-- 3. AGE GROUPS + CATEGORIES
-- =========================================================================
create table if not exists public.age_groups (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  slug text not null unique,
  sort_order int not null default 0
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  image_url text,
  display_shape text not null default 'circle' check (display_shape in ('circle','square')),
  is_featured_in_menu boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now()
);
create index if not exists categories_parent_idx on public.categories(parent_id);
create index if not exists categories_slug_idx on public.categories(slug);

-- =========================================================================
-- 4. PRODUCTS
-- =========================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  category_id uuid references public.categories(id) on delete set null,
  gender text check (gender in ('boys','girls','unisex')),
  brand text default 'Jack & Jill',
  base_price numeric(10,2) not null,
  mrp numeric(10,2) not null,
  status text not null default 'active' check (status in ('draft','active','out_of_stock','archived')),
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  meta_title text,
  meta_description text,
  alt_text text,
  size_chart_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_slug_idx on public.products(slug);
create index if not exists products_featured_idx on public.products(is_featured);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int not null default 0
);
create index if not exists product_images_pid_idx on public.product_images(product_id);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text,
  color text,
  color_hex text,
  sku text unique,
  stock_qty int not null default 0,
  price_override numeric(10,2)
);
create index if not exists product_variants_pid_idx on public.product_variants(product_id);

create table if not exists public.product_age_groups (
  product_id uuid not null references public.products(id) on delete cascade,
  age_group_id uuid not null references public.age_groups(id) on delete cascade,
  primary key (product_id, age_group_id)
);

-- =========================================================================
-- 5. REVIEWS
-- =========================================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  author_name text,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists reviews_pid_idx on public.reviews(product_id);

-- =========================================================================
-- 6. CARTS + WISHLIST
-- =========================================================================
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  session_id text,
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique(cart_id, variant_id)
);

create table if not exists public.wishlists (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, product_id)
);

-- =========================================================================
-- 7. ORDERS
-- =========================================================================
create sequence if not exists order_number_seq start 100001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('JJ' || nextval('order_number_seq')::text),
  user_id uuid references public.profiles(id) on delete set null,
  guest_email text,
  guest_phone text,
  status text not null default 'placed' check (status in ('placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','return_requested','return_approved','refunded')),
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  shipping_fee numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  coupon_code text,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded','cod')),
  payment_method text check (payment_method in ('razorpay','cod')),
  razorpay_order_id text,
  razorpay_payment_id text,
  shipping_address jsonb not null,
  tracking_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_number_idx on public.orders(order_number);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_label text,
  image_url text,
  quantity int not null,
  price_at_purchase numeric(10,2) not null
);
create index if not exists order_items_oid_idx on public.order_items(order_id);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists osh_oid_idx on public.order_status_history(order_id);

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  reason text,
  status text not null default 'requested' check (status in ('requested','approved','rejected','refunded')),
  refund_amount numeric(10,2),
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 8. COUPONS
-- =========================================================================
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent','flat')),
  value numeric(10,2) not null,
  min_cart_value numeric(10,2) default 0,
  max_discount numeric(10,2),
  usage_limit int,
  per_user_limit int default 1,
  valid_from timestamptz,
  valid_to timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 9. CMS + HOMEPAGE
-- =========================================================================
create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_type text not null,
  title text,
  subtitle text,
  config jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text,
  meta_title text,
  meta_description text,
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  page_context text default 'general',
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists public.trust_badges (
  id uuid primary key default gen_random_uuid(),
  icon text,
  label text not null,
  subtext text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 10. SETTINGS + AUDIT
-- =========================================================================
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pincodes (
  pincode text primary key,
  city text,
  state text,
  is_serviceable boolean not null default true,
  cod_available boolean not null default true,
  est_delivery_days int default 5
);

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.age_groups enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_age_groups enable row level security;
alter table public.reviews enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.returns enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_usages enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.cms_pages enable row level security;
alter table public.faqs enable row level security;
alter table public.trust_badges enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.pincodes enable row level security;

-- Helper: is_admin
create or replace function public.is_admin(u uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.profiles where id = u and role in ('super_admin','order_manager','content_manager'));
$$;

create or replace function public.is_super_admin(u uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.profiles where id = u and role = 'super_admin');
$$;

-- PROFILES
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles for select using (auth.uid() = id or public.is_admin(auth.uid()));
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles for all using (public.is_super_admin(auth.uid()));

-- ADDRESSES
drop policy if exists "addresses_owner" on public.addresses;
create policy "addresses_owner" on public.addresses for all using (auth.uid() = user_id);

-- PUBLIC READ (age_groups, categories active, products active, images, variants, reviews approved, homepage active, cms, faqs active, trust active, pincodes)
drop policy if exists "age_groups_read" on public.age_groups;
create policy "age_groups_read" on public.age_groups for select using (true);
drop policy if exists "age_groups_admin" on public.age_groups;
create policy "age_groups_admin" on public.age_groups for all using (public.is_admin(auth.uid()));

drop policy if exists "categories_read" on public.categories;
create policy "categories_read" on public.categories for select using (is_active = true or public.is_admin(auth.uid()));
drop policy if exists "categories_admin" on public.categories;
create policy "categories_admin" on public.categories for all using (public.is_admin(auth.uid()));

drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products for select using (status in ('active','out_of_stock') or public.is_admin(auth.uid()));
drop policy if exists "products_admin" on public.products;
create policy "products_admin" on public.products for all using (public.is_admin(auth.uid()));

drop policy if exists "product_images_read" on public.product_images;
create policy "product_images_read" on public.product_images for select using (true);
drop policy if exists "product_images_admin" on public.product_images;
create policy "product_images_admin" on public.product_images for all using (public.is_admin(auth.uid()));

drop policy if exists "product_variants_read" on public.product_variants;
create policy "product_variants_read" on public.product_variants for select using (true);
drop policy if exists "product_variants_admin" on public.product_variants;
create policy "product_variants_admin" on public.product_variants for all using (public.is_admin(auth.uid()));

drop policy if exists "product_age_groups_read" on public.product_age_groups;
create policy "product_age_groups_read" on public.product_age_groups for select using (true);
drop policy if exists "product_age_groups_admin" on public.product_age_groups;
create policy "product_age_groups_admin" on public.product_age_groups for all using (public.is_admin(auth.uid()));

drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read" on public.reviews for select using (is_approved = true or auth.uid() = user_id or public.is_admin(auth.uid()));
drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_insert" on public.reviews for insert with check (auth.uid() = user_id or auth.uid() is not null);
drop policy if exists "reviews_admin" on public.reviews;
create policy "reviews_admin" on public.reviews for all using (public.is_admin(auth.uid()));

-- CARTS / WISHLIST — owner only
drop policy if exists "carts_owner" on public.carts;
create policy "carts_owner" on public.carts for all using (auth.uid() = user_id);
drop policy if exists "cart_items_owner" on public.cart_items;
create policy "cart_items_owner" on public.cart_items for all using (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
drop policy if exists "wishlists_owner" on public.wishlists;
create policy "wishlists_owner" on public.wishlists for all using (auth.uid() = user_id);

-- ORDERS — owner or admin
drop policy if exists "orders_owner" on public.orders;
create policy "orders_owner" on public.orders for select using (auth.uid() = user_id or public.is_admin(auth.uid()));
drop policy if exists "orders_admin_write" on public.orders;
create policy "orders_admin_write" on public.orders for all using (public.is_admin(auth.uid()));

drop policy if exists "order_items_owner" on public.order_items;
create policy "order_items_owner" on public.order_items for select using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin(auth.uid()))));
drop policy if exists "order_items_admin" on public.order_items;
create policy "order_items_admin" on public.order_items for all using (public.is_admin(auth.uid()));

drop policy if exists "osh_owner_read" on public.order_status_history;
create policy "osh_owner_read" on public.order_status_history for select using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin(auth.uid()))));
drop policy if exists "osh_admin" on public.order_status_history;
create policy "osh_admin" on public.order_status_history for all using (public.is_admin(auth.uid()));

drop policy if exists "returns_owner" on public.returns;
create policy "returns_owner" on public.returns for select using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin(auth.uid()))));
drop policy if exists "returns_admin" on public.returns;
create policy "returns_admin" on public.returns for all using (public.is_admin(auth.uid()));

-- COUPONS — public read of active codes for validation, admin manages
drop policy if exists "coupons_read" on public.coupons;
create policy "coupons_read" on public.coupons for select using (is_active = true or public.is_admin(auth.uid()));
drop policy if exists "coupons_admin" on public.coupons;
create policy "coupons_admin" on public.coupons for all using (public.is_admin(auth.uid()));

drop policy if exists "coupon_usages_admin" on public.coupon_usages;
create policy "coupon_usages_admin" on public.coupon_usages for all using (public.is_admin(auth.uid()));

-- CMS / CONTENT — public read active, admin write
drop policy if exists "homepage_read" on public.homepage_sections;
create policy "homepage_read" on public.homepage_sections for select using (is_active = true or public.is_admin(auth.uid()));
drop policy if exists "homepage_admin" on public.homepage_sections;
create policy "homepage_admin" on public.homepage_sections for all using (public.is_admin(auth.uid()));

drop policy if exists "cms_read" on public.cms_pages;
create policy "cms_read" on public.cms_pages for select using (true);
drop policy if exists "cms_admin" on public.cms_pages;
create policy "cms_admin" on public.cms_pages for all using (public.is_admin(auth.uid()));

drop policy if exists "faqs_read" on public.faqs;
create policy "faqs_read" on public.faqs for select using (is_active = true or public.is_admin(auth.uid()));
drop policy if exists "faqs_admin" on public.faqs;
create policy "faqs_admin" on public.faqs for all using (public.is_admin(auth.uid()));

drop policy if exists "trust_read" on public.trust_badges;
create policy "trust_read" on public.trust_badges for select using (is_active = true or public.is_admin(auth.uid()));
drop policy if exists "trust_admin" on public.trust_badges;
create policy "trust_admin" on public.trust_badges for all using (public.is_admin(auth.uid()));

-- CONTACT — anyone insert, admin read
drop policy if exists "contact_insert" on public.contact_submissions;
create policy "contact_insert" on public.contact_submissions for insert with check (true);
drop policy if exists "contact_admin" on public.contact_submissions;
create policy "contact_admin" on public.contact_submissions for select using (public.is_admin(auth.uid()));

-- SETTINGS — admin only
drop policy if exists "settings_admin" on public.settings;
create policy "settings_admin" on public.settings for all using (public.is_super_admin(auth.uid()));
-- Public read only for non-sensitive settings (whitelisted keys)
drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings for select using (key in ('shipping','trust_stats','contact_info','brand'));

-- AUDIT — admin only
drop policy if exists "audit_admin" on public.audit_logs;
create policy "audit_admin" on public.audit_logs for select using (public.is_super_admin(auth.uid()));

-- PINCODES — public read
drop policy if exists "pincodes_read" on public.pincodes;
create policy "pincodes_read" on public.pincodes for select using (true);
drop policy if exists "pincodes_admin" on public.pincodes;
create policy "pincodes_admin" on public.pincodes for all using (public.is_admin(auth.uid()));
