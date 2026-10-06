-- Coming-soon switch (Admin → Settings → Website status).
-- The value only says whether the shop is open to everyone; it holds no secret,
-- so it joins the settings anyone may read (the middleware reads it with the anon key).
alter policy "settings_public_read" on public.settings
  using (key = any (array['shipping','trust_stats','contact_info','brand','social','site_mode']));

insert into public.settings(key, value, updated_at)
values ('site_mode', jsonb_build_object('live', false, 'changed_at', now()), now())
on conflict (key) do nothing;
