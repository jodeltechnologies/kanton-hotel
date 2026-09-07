-- =============================================================
-- Kanton Hotel — upgrade 002
-- Room media (photos + video), guest email, the reception tablet
-- and the ID card recorded at check-in.
-- Safe to run on top of schema.sql, and safe to run twice.
-- =============================================================

-- ---------- rooms: video alongside the photos -----------------
alter table public.rooms add column if not exists videos text[] not null default '{}';

-- ---------- reservations: kiosk source, ID card, timestamps ---
alter table public.reservations drop constraint if exists reservations_source_check;
alter table public.reservations add constraint reservations_source_check
  check (source in ('online','walk-in','kiosk'));

alter table public.reservations add column if not exists id_card_type        text not null default '';
alter table public.reservations add column if not exists id_card_number      text not null default '';
alter table public.reservations add column if not exists checked_in_at       timestamptz;
alter table public.reservations add column if not exists checked_in_by       text not null default '';
alter table public.reservations add column if not exists checked_out_at      timestamptz;
alter table public.reservations add column if not exists confirmation_sent_at timestamptz;

-- ---------- settings: tablet PIN and the address mail goes out from
alter table public.settings add column if not exists kiosk_pin text not null default '2468';
alter table public.settings add column if not exists mail_from text not null default '';

-- =============================================================
-- Storage bucket for room photos and video
-- =============================================================
insert into storage.buckets (id, name, public)
values ('room-media', 'room-media', true)
on conflict (id) do nothing;

drop policy if exists "room media is public" on storage.objects;
create policy "room media is public" on storage.objects
  for select using (bucket_id = 'room-media');
-- uploads and deletes happen server-side with the service role key,
-- so no insert/delete policy is needed for the browser.
