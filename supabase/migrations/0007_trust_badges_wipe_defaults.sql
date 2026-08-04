-- Phase S — Trust badges redesign
-- Wipe the default seeded rows (they all use the brand logo as the icon which
-- looks broken/repetitive). Admin will add real ones intentionally from the
-- CMS editor.
delete from public.trust_badges;
