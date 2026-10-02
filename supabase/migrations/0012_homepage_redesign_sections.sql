-- =========================================================================
-- 0012 — Homepage sections for the approved redesign
--
-- Adds three homepage sections (only if missing), so they show up in
-- Admin › Homepage where they can be renamed, reordered or hidden:
--   age_groups  "Shop by age" bubbles, placed right after the hero
--   visit_store store card (address/hours/WhatsApp from Admin › Settings › Contact)
--   faq         "Parents ask us" (questions from Admin › CMS › FAQs)
-- Safe to re-run.
-- =========================================================================

do $$
declare
  hero_pos int;
  last_pos int;
begin
  if not exists (select 1 from public.homepage_sections where section_type = 'age_groups') then
    select coalesce(min(sort_order), 0) into hero_pos from public.homepage_sections where section_type = 'hero';
    update public.homepage_sections set sort_order = sort_order + 1 where sort_order > hero_pos;
    insert into public.homepage_sections (section_type, title, subtitle, config, sort_order, is_active)
    values ('age_groups', 'Shop by age', null, '{}'::jsonb, hero_pos + 1, true);
  end if;

  select coalesce(max(sort_order), 0) into last_pos from public.homepage_sections;

  if not exists (select 1 from public.homepage_sections where section_type = 'visit_store') then
    insert into public.homepage_sections (section_type, title, subtitle, config, sort_order, is_active)
    values ('visit_store', 'Visit our Shahupuri store', null, '{}'::jsonb, last_pos + 1, true);
    last_pos := last_pos + 1;
  end if;

  if not exists (select 1 from public.homepage_sections where section_type = 'faq') then
    insert into public.homepage_sections (section_type, title, subtitle, config, sort_order, is_active)
    values ('faq', 'Parents ask us', null, '{"limit": 4}'::jsonb, last_pos + 1, true);
  end if;
end $$;
