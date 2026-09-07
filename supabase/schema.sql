-- =============================================================
-- Kanton Hotel V.I.P — database schema
-- Run this once in Supabase → SQL Editor → New query.
-- =============================================================
create extension if not exists pgcrypto;

-- ---------- settings (single row) ----------------------------
create table if not exists public.settings (
  id                    int primary key default 1 check (id = 1),
  hotel_name            text not null default 'Kanton Hotel V.I.P',
  tagline               text not null default 'Style, elegance and luxury on Krammer Avenue, Kumba.',
  address               text not null default 'Krammer Avenue, Kumba',
  po_box                text not null default 'P.O. Box 250',
  phone                 text not null default '+237 675 984 836',
  whatsapp              text not null default '237675984836',
  email                 text not null default '',
  checkout_time         text not null default '12:00 noon',
  currency              text not null default 'FCFA',
  momo_number           text not null default '675984836',
  momo_name             text not null default 'Kanton Hotel',
  momo_pattern          text not null default '*126*9*{number}*{amount}#',
  advance_percent       int  not null default 40 check (advance_percent between 0 and 100),
  hold_hours            int  not null default 6  check (hold_hours between 1 and 168),
  arrival_grace_hours   int  not null default 24,
  cancel_window_hours   int  not null default 24,
  strike_limit          int  not null default 2  check (strike_limit between 1 and 10),
  policy_text           text not null default 'A room is only held once your advance has been received. If someone pays at the desk before you, the room goes to them. If you book and do not arrive — or arrive days late without telling us — the advance is not refunded and the room is released.',
  owner_name            text not null default 'Kanton Hotel management',
  owner_phone           text not null default '+237 675 984 836',
  kiosk_pin             text not null default '2468',
  mail_from             text not null default '',
  updated_at            timestamptz not null default now()
);

-- ---------- rooms --------------------------------------------
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  number      text not null unique,
  name        text not null,
  category    text not null default 'standard'
              check (category in ('standard','modern','vip','executive')),
  price       int  not null check (price >= 0),
  floor       int  not null default 1,
  capacity    int  not null default 2,
  bed         text not null default '1 queen bed',
  description text not null default '',
  amenities   text[] not null default '{}',
  photos      text[] not null default '{bed}',
  videos      text[] not null default '{}',
  status      text not null default 'available'
              check (status in ('available','occupied','cleaning','maintenance')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- food menu ----------------------------------------
create table if not exists public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price       int  not null check (price >= 0),
  category    text not null default 'Main dishes',
  description text not null default '',
  available   boolean not null default true,
  sort_order  int not null default 0
);

-- ---------- staff (one row per auth user) --------------------
create table if not exists public.staff (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique,
  full_name  text not null,
  phone      text not null default '',
  role       text not null default 'receptionist'
             check (role in ('owner','manager','receptionist','cashier','housekeeping')),
  active     boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- reservations -------------------------------------
create table if not exists public.reservations (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  source          text not null default 'online'
                  constraint reservations_source_check check (source in ('online','walk-in','kiosk')),
  guest_name      text not null,
  guest_phone     text not null,
  guest_email     text not null default '',
  room_id         uuid references public.rooms(id) on delete set null,
  room_label      text not null,
  room_name       text not null default '',
  room_price      int  not null default 0,
  check_in        date not null,
  check_out       date not null,
  nights          int  not null check (nights > 0),
  guests          int  not null default 1,
  arrival         text not null default 'afternoon',
  note            text not null default '',
  food            jsonb not null default '[]'::jsonb,
  food_total      int  not null default 0,
  room_total      int  not null default 0,
  total           int  not null default 0,
  advance_percent int  not null default 40,
  advance_due     int  not null default 0,
  paid            int  not null default 0,
  status          text not null default 'held'
                  check (status in ('held','confirmed','checked_in','checked_out','cancelled','no_show')),
  payment_status  text not null default 'unpaid'
                  check (payment_status in ('unpaid','reported','part','confirmed','settled')),
  momo_ref        text not null default '',
  hold_until      timestamptz,
  id_card_type    text not null default '',
  id_card_number  text not null default '',
  checked_in_at   timestamptz,
  checked_in_by   text not null default '',
  checked_out_at  timestamptz,
  confirmation_sent_at timestamptz,
  history         jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint dates_make_sense check (check_out > check_in)
);
create index if not exists reservations_dates_idx  on public.reservations (check_in, check_out);
create index if not exists reservations_room_idx   on public.reservations (room_id);
create index if not exists reservations_phone_idx  on public.reservations (guest_phone);
create index if not exists reservations_status_idx on public.reservations (status);

-- ---------- payments -----------------------------------------
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  receipt_no     text not null unique,
  amount         int  not null check (amount > 0),
  method         text not null default 'Mobile Money',
  reference      text not null default '',
  taken_by       uuid references public.staff(id) on delete set null,
  taken_by_name  text not null default '',
  created_at     timestamptz not null default now()
);
create index if not exists payments_res_idx on public.payments (reservation_id);
create index if not exists payments_day_idx on public.payments (created_at);

-- ---------- no-show list -------------------------------------
create table if not exists public.blacklist (
  id      uuid primary key default gen_random_uuid(),
  phone   text not null unique,
  name    text not null default '',
  strikes int  not null default 0,
  banned  boolean not null default false,
  reason  text not null default '',
  last_at timestamptz not null default now()
);

-- =============================================================
-- Keep reservations.paid in step with the payments table
-- =============================================================
create or replace function public.sync_reservation_paid()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rid uuid := coalesce(new.reservation_id, old.reservation_id);
  total_paid int;
  r public.reservations%rowtype;
begin
  select coalesce(sum(amount), 0) into total_paid from public.payments where reservation_id = rid;
  select * into r from public.reservations where id = rid;
  if not found then return null; end if;

  update public.reservations set
    paid = total_paid,
    status = case when r.status = 'held' and total_paid >= r.advance_due then 'confirmed' else r.status end,
    payment_status = case
      when total_paid >= r.total then 'settled'
      when total_paid >= r.advance_due and total_paid > 0 then 'confirmed'
      when total_paid > 0 then 'part'
      else 'unpaid' end,
    updated_at = now()
  where id = rid;
  return null;
end $$;

drop trigger if exists payments_sync on public.payments;
create trigger payments_sync
after insert or update or delete on public.payments
for each row execute function public.sync_reservation_paid();

-- =============================================================
-- Row level security
-- The browser only ever reads the public catalogue with the anon
-- key. Every write, and every look at guest or staff data, goes
-- through the Next.js server with the service role key.
-- =============================================================
alter table public.settings     enable row level security;
alter table public.rooms        enable row level security;
alter table public.menu_items   enable row level security;
alter table public.staff        enable row level security;
alter table public.reservations enable row level security;
alter table public.payments     enable row level security;
alter table public.blacklist    enable row level security;

drop policy if exists "settings readable"  on public.settings;
drop policy if exists "rooms readable"     on public.rooms;
drop policy if exists "menu readable"      on public.menu_items;
drop policy if exists "staff sees self"    on public.staff;

create policy "settings readable" on public.settings   for select using (true);
create policy "rooms readable"    on public.rooms      for select using (true);
create policy "menu readable"     on public.menu_items for select using (true);
create policy "staff sees self"   on public.staff      for select using (auth.uid() = id);
-- reservations, payments and blacklist have no public policy at all:
-- nothing is readable or writable with the anon key.


-- =============================================================
-- Storage bucket for room photos and video (see migration_002.sql
-- if this database was created before that upgrade).
-- =============================================================
insert into storage.buckets (id, name, public)
values ('room-media', 'room-media', true)
on conflict (id) do nothing;

drop policy if exists "room media is public" on storage.objects;
create policy "room media is public" on storage.objects
  for select using (bucket_id = 'room-media');
