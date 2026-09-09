-- =========================================================================
-- Multi-category products: products.category_id remains the "primary"
-- category (breadcrumbs/canonical URL); product_categories adds the
-- many-to-many mapping, mirroring the existing product_age_groups pattern.
-- =========================================================================
create table if not exists public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create index if not exists product_categories_pid_idx on public.product_categories(product_id);
create index if not exists product_categories_cid_idx on public.product_categories(category_id);

alter table public.product_categories enable row level security;

drop policy if exists "product_categories_read" on public.product_categories;
create policy "product_categories_read" on public.product_categories for select using (true);
drop policy if exists "product_categories_admin" on public.product_categories;
create policy "product_categories_admin" on public.product_categories for all using (public.is_admin(auth.uid()));

-- Backfill: every existing product's primary category becomes its first
-- row in the junction table. on conflict guards re-running this migration.
insert into public.product_categories (product_id, category_id)
select id, category_id from public.products
where category_id is not null
on conflict (product_id, category_id) do nothing;
