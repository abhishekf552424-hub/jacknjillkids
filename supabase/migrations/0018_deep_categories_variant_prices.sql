-- =========================================================================
-- 0018: categories in many places + a price (and MRP) per size/colour
--
-- 1. product_categories: the "show this product in several categories"
--    table from 0009 was never created on the live database, so extra
--    categories picked in Admin → Products were silently dropped.
-- 2. product_variants.mrp_override: each size can have its own MRP, not
--    only its own selling price (e.g. 0-6M ₹499 / MRP ₹699, 2-3Y ₹699 / MRP ₹899).
-- 3. products.price_min / price_max / mrp_min: the cheapest and dearest
--    selling price across the sizes, kept up to date by triggers. Listing
--    cards show "From ₹…" and price sort/filters use the real lowest price.
-- =========================================================================

-- 1 ----------------------------------------------------------------------
create table if not exists public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);
create index if not exists product_categories_cid_idx on public.product_categories(category_id);
alter table public.product_categories enable row level security;
drop policy if exists "product_categories_read" on public.product_categories;
create policy "product_categories_read" on public.product_categories for select using (true);
drop policy if exists "product_categories_admin" on public.product_categories;
create policy "product_categories_admin" on public.product_categories for all using (public.is_super_admin((select auth.uid())));

insert into public.product_categories (product_id, category_id)
select id, category_id from public.products where category_id is not null
on conflict do nothing;

-- 2 ----------------------------------------------------------------------
alter table public.product_variants add column if not exists mrp_override numeric(10,2);

-- 3 ----------------------------------------------------------------------
alter table public.products add column if not exists price_min numeric(10,2);
alter table public.products add column if not exists price_max numeric(10,2);
alter table public.products add column if not exists mrp_min numeric(10,2);

-- Fills the three columns on the product row being written.
create or replace function public.products_price_range()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select
    min(coalesce(v.price_override, new.base_price)) as pmin,
    max(coalesce(v.price_override, new.base_price)) as pmax
  into r
  from public.product_variants v where v.product_id = new.id;

  new.price_min := coalesce(r.pmin, new.base_price);
  new.price_max := coalesce(r.pmax, new.base_price);
  -- MRP shown next to the lowest price: that size's own MRP, else the product MRP
  -- (never below the price itself, so no fake "discount").
  select greatest(coalesce(v.mrp_override, new.mrp), coalesce(v.price_override, new.base_price))
    into new.mrp_min
  from public.product_variants v
  where v.product_id = new.id
  order by coalesce(v.price_override, new.base_price), coalesce(v.mrp_override, new.mrp) desc
  limit 1;
  new.mrp_min := coalesce(new.mrp_min, greatest(new.mrp, new.base_price));
  return new;
end $$;

drop trigger if exists products_price_range on public.products;
create trigger products_price_range before insert or update on public.products
for each row execute function public.products_price_range();

-- When a size is added, changed or removed, touch its product so the trigger above re-runs.
create or replace function public.variants_touch_product()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.products set price_min = null where id = old.product_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and (tg_op = 'INSERT' or new.product_id is distinct from old.product_id) then
    update public.products set price_min = null where id = new.product_id;
  end if;
  return null;
end $$;

drop trigger if exists variants_touch_product on public.product_variants;
create trigger variants_touch_product
after insert or delete or update of price_override, mrp_override, product_id on public.product_variants
for each row execute function public.variants_touch_product();

revoke execute on function public.products_price_range() from public, anon, authenticated;
revoke execute on function public.variants_touch_product() from public, anon, authenticated;

-- Backfill every product once.
update public.products set price_min = null;
