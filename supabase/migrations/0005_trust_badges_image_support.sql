-- Add icon_type and icon_url columns to trust_badges table for custom image support

alter table public.trust_badges
  add column if not exists icon_type text default 'lucide' check (icon_type in ('lucide', 'image')),
  add column if not exists icon_url text;

comment on column public.trust_badges.icon_type is 'Type of icon: lucide (text name) or image (uploaded)';
comment on column public.trust_badges.icon_url is 'URL of uploaded icon image (when icon_type = image)';
