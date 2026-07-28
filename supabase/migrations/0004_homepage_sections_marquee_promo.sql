-- 0004: add new homepage section types (marquee, promo_strip)
-- Idempotent — safe to run multiple times.

-- Marquee announcement strip (sits near top, before categories)
insert into public.homepage_sections (section_type, title, subtitle, config, sort_order, is_active)
select 'marquee', null, null,
       jsonb_build_object(
         'items', to_jsonb(array[
           'Free Shipping ₹999+',
           'Easy 7-Day Returns',
           '22 Years of Trust',
           'Skin-Safe Quality',
           'COD Available'
         ]),
         'speed_sec', 30
       ),
       coalesce((select min(sort_order) from public.homepage_sections), 1) + 0,
       true
where not exists (select 1 from public.homepage_sections where section_type = 'marquee');

-- 3-card promo strip (after "Shop by Category")
insert into public.homepage_sections (section_type, title, subtitle, config, sort_order, is_active)
select 'promo_strip', null, null,
       jsonb_build_object(
         'cards', to_jsonb(array[
           jsonb_build_object('image', '', 'headline', 'Free Shipping Above ₹999', 'subtext', 'Delivered fast, anywhere in India', 'link', '/shop'),
           jsonb_build_object('image', '', 'headline', 'Easy 7-Day Returns',       'subtext', 'No-questions-asked exchanges',    'link', '/legal/returns'),
           jsonb_build_object('image', '', 'headline', 'New Arrivals Every Week',  'subtext', 'Freshly curated for little ones', 'link', '/shop?sort=newest')
         ])
       ),
       coalesce((select sort_order from public.homepage_sections where section_type = 'categories' limit 1), 3) + 1,
       true
where not exists (select 1 from public.homepage_sections where section_type = 'promo_strip');
