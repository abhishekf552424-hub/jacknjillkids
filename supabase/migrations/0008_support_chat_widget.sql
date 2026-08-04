-- Phase T — Support chat widget: attachment support + guest ticket fields
-- support_ticket_messages: optional image attachment URL (screenshot from widget)
alter table public.support_ticket_messages
  add column if not exists attachment_url text;

-- support_tickets: optional guest name/phone for guest submissions from the widget
alter table public.support_tickets
  add column if not exists guest_name text;
alter table public.support_tickets
  add column if not exists guest_phone text;

-- Allow anonymous inserts of tickets (guests submitting from the chat widget).
-- Read/update still restricted by existing "tickets_owner" policy.
drop policy if exists "tickets_public_insert" on public.support_tickets;
create policy "tickets_public_insert" on public.support_tickets
  for insert to anon, authenticated
  with check (true);

drop policy if exists "ticket_msg_public_insert" on public.support_ticket_messages;
create policy "ticket_msg_public_insert" on public.support_ticket_messages
  for insert to anon, authenticated
  with check (true);
