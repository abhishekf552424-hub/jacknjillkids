-- =========================================================================
-- 0015 — Homepage v2: new sections, approved order, club sign-ups
-- Safe to re-run: sections are added only if missing; the order is re-applied.
-- =========================================================================

-- WhatsApp club sign-ups (written only by the server, read only by admins)
create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique check (phone ~ '^[6-9][0-9]{9}$'),
  consent boolean not null default true,
  source text not null default 'homepage',
  created_at timestamptz not null default now()
);
alter table public.club_members enable row level security;
do $$ begin if not exists (select 1 from pg_policies where tablename='club_members' and policyname='club_admin_read') then create policy "club_admin_read" on public.club_members for select using (public.is_admin(auth.uid())); end if; end $$;

-- New sections (added once) -------------------------------------------------
insert into public.homepage_sections (section_type, title, subtitle, config, sort_order, is_active)
select v.section_type, v.title, v.subtitle, v.config::jsonb, 50, true
from (values
  ('age_groups', 'Shop by age', null,
   '{"eyebrow":"Find the right fit","link":"/faq","link_text":"Size help","hints":{"0-12m":"Newborn & baby","1-2y":"Toddler","2-4y":"Little ones","4-6y":"Pre-school","6-8y":"Little kids","8-10y":"Big kids","10y-plus":"Tweens"}}'),
  ('occasions', 'Dressed for every occasion', null,
   '{"eyebrow":"Collections","cards":[{"title":"Festive","subtitle":"Kurtas, lehengas and festival sets","image":"","link":"/category/clothing"},{"title":"Party & birthday","subtitle":"Frocks, suits and party wear","image":"","link":"/category/clothing"},{"title":"Back to school","subtitle":"Bags, bottles and school accessories","image":"","link":"/category/school-accessories"}]}'),
  ('gift_corner', 'Birthday coming up?', 'Pick a budget and we''ll show gifts kids love. Free gift wrap with a handwritten note.',
   '{"eyebrow":"Gift corner","cta_text":"See gift hampers","cta_link":"/category/gift-hampers","budgets":[{"amount":499,"hint":"Small smiles"},{"amount":999,"hint":"Most gifted"},{"amount":1999,"hint":"Big surprises"}]}'),
  ('shop_the_look', 'Shop the look', null, '{"eyebrow":"Complete outfits","image":"","product_ids":[]}'),
  ('visit_store', 'Come try it on in Shahupuri', null, '{"eyebrow":"Visit us","image":""}'),
  ('faq', 'Questions, answered', null, '{"eyebrow":"Parents ask","limit":6}'),
  ('join_club', 'Join the Jack & Jill club', 'New arrivals, festival offers and a first-order code, on WhatsApp.',
   '{"eyebrow":"Jack & Jill club","button_text":"Join the club","coupon_code":"WELCOME10"}'),
  ('sign_off', 'Made with love in Kolhapur.', 'Jack & Jill · Shahupuri, Kolhapur · Since 2003', '{}')
) as v(section_type, title, subtitle, config)
where not exists (select 1 from public.homepage_sections h where h.section_type = v.section_type);

-- Approved order --------------------------------------------------------------
update public.homepage_sections set sort_order = case
  when section_type = 'marquee' then 1
  when section_type = 'hero' then 2
  when section_type = 'age_groups' then 3
  when section_type = 'categories' then 4
  when section_type = 'promo_strip' then 5
  when section_type = 'product_shelf' and coalesce(config->>'filter', 'featured') <> 'new_arrivals' then 6
  when section_type = 'occasions' then 7
  when section_type = 'product_shelf' and config->>'filter' = 'new_arrivals' then 8
  when section_type = 'gift_corner' then 9
  when section_type = 'shop_the_look' then 10
  when section_type = 'brand_story' then 11
  when section_type = 'parents_reviews' then 12
  when section_type = 'instagram_reels' then 13
  when section_type = 'visit_store' then 14
  when section_type = 'faq' then 15
  when section_type = 'join_club' then 16
  when section_type = 'sign_off' then 17
  when section_type = 'trust_badges' then 99
  else sort_order end,
  updated_at = now();

-- The footer now carries the delivery / exchange / payment promises, so the
-- separate trust badge strip is switched off (it can be switched on again in Admin).
update public.homepage_sections set is_active = false where section_type = 'trust_badges' and is_active;
