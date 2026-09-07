# Kanton Hotel V.I.P — reservation and front-desk system

Krammer Avenue, Kumba. Guests reserve a room and their meals before they travel, pay an
advance by Mobile Money, and reception runs the house from the same database: bookings,
payments, receipts, check-in with the ID card, the room board and the day's takings.

**Stack:** Next.js 15 (App Router, server actions) · Supabase (Postgres, Auth, Storage) ·
deployed on Vercel. No client-side database access: the browser only reads the public room
catalogue, everything else goes through the server.

---

## What it does

**For the guest**
- Room grid with real photographs, a walk-through video when the manager uploads one,
  prices, what each room offers, and live availability.
- Reserve dates, add meals from the kitchen menu, agree to the house rules.
- Pay the advance: one tap opens the phone dialler already loaded with
  `*126*9*<number>*<amount>#`. The number, the percentage and the pattern are all set by
  the manager.
- Confirmation by email the moment the booking is made, and again when reception records
  the money.
- Send the payment screenshot on WhatsApp, or paste the transaction ID — the desk sees it
  flagged as "says paid".
- "Find my booking" by code or phone; print the receipt; cancel.

**At the desk**
- Today board: arrivals, guests in house, free rooms, money taken today.
- Bookings list with filters and search; take payment (advance or full, any method) which
  mints a numbered receipt; **check-in records the ID card type and number**; check-out;
  cancel; mark a no-show; move a booking to another room, repriced automatically.
- Room board for housekeeping, takings report with the full payment log.

**Reception tablet (`/kiosk`)**
A guest standing at the desk picks a free room on the tablet, gives their name, phone and
ID number, and gets a booking code in about thirty seconds — then pays at the desk or from
their own phone.

**General manager (the owner account)**
Advance percentage, hold hours, no-show grace, cancellation window, strike limit, policy
wording, Mobile Money details, hotel identity, tablet PIN, sender address for email.
Staff accounts with roles. Rooms: number, name, category, price, floor, capacity, bed,
description, the list of options, and photo/video upload. Food menu. No-show list.

**Roles**
| Role | What they can touch |
|---|---|
| General manager (owner) | Everything |
| Front office manager | Desk, payments, rooms, menu, reports, cancellations, no-shows |
| Receptionist | Bookings, payments, check-in/out, room board |
| Cashier | Payments, receipts, takings |
| Housekeeping | Room board only |

**The house rule the system actually enforces:** an unpaid booking never blocks a room.
If somebody else pays for it first, the guest's payment page and the desk both show
"room sold to someone else — move them", and the desk gets a Move room tool.

---

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (region: choose the one
   closest to Cameroon, usually `eu-central-1`).
2. **SQL Editor → New query** → paste `supabase/schema.sql` → Run.
3. New query → paste `supabase/seed.sql` → Run. That loads the twelve rooms from the price
   list on the reception desk and the kitchen menu.
   *(If your database was created before the media upgrade, run
   `supabase/migration_002.sql` as well — it is safe to run twice.)*
4. **Authentication → Providers → Email**: turn off "Confirm email" so the manager can
   create staff accounts that work immediately.
5. **Project settings → API**: copy the Project URL, the `anon` key and the
   `service_role` key.

The schema turns on row level security everywhere. Only `settings`, `rooms` and
`menu_items` are readable with the anon key; reservations, payments, staff and the
no-show list have no public policy at all.

## 2. Run it locally

```bash
npm install
cp .env.example .env.local     # paste your three Supabase values
npm run dev                    # http://localhost:3000
```

Open **/setup** once and create the general manager account. That page closes itself
as soon as a staff account exists. From then on, sign in at **/login**.

## 3. GitHub

```bash
git init
git add .
git commit -m "Kanton Hotel reservation system"
git branch -M main
git remote add origin https://github.com/<you>/kanton-hotel.git
git push -u origin main
```

`.env.local` is git-ignored. Never commit the service role key.

## 4. Vercel

1. [vercel.com/new](https://vercel.com/new) → import the repository. The framework is
   detected as Next.js; leave the build settings alone.
2. **Environment variables** — add for Production, Preview and Development:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service role key (secret) |
   | `RESEND_API_KEY` | optional, for guest email |
   | `MAIL_FROM` | optional, e.g. `Kanton Hotel <bookings@yourdomain.cm>` |
   | `NEXT_PUBLIC_SITE_URL` | your final domain, e.g. `https://kantonhotel.cm` |

3. Deploy. Then add your domain under **Settings → Domains**.
4. Open `/setup` on the live site if you have not created the manager account yet.

Every push to `main` redeploys. Pull requests get their own preview URL.

## 5. Email confirmations

1. Create an account at [resend.com](https://resend.com), add and verify your domain
   (three DNS records), and create an API key.
2. Put `RESEND_API_KEY` and `MAIL_FROM` in Vercel and redeploy.

Without a key the app runs exactly as before — it simply does not send mail. Sending is
wrapped so a mail failure can never break a booking.

## 6. The tablet at reception

1. On the tablet, open `https://your-domain/kiosk`.
2. Type the tablet PIN (default `2468`, change it in **Hotel settings → Reception
   tablet**). The device stays unlocked for 30 days.
3. Add the page to the home screen so it opens full screen, and leave the tablet on that
   page. Every booking it creates is marked "on the reception tablet" on the desk list.

## 7. Room photos and video

**Hotel settings → Rooms & prices → Edit → Photos and video.** Photographs up to 8 MB,
video up to 60 MB (mp4 or webm), stored in the public `room-media` bucket. The eleven
photographs shipped in `public/photos` stay available as house pictures for any room.

---

## Project layout

```
supabase/schema.sql          tables, trigger, row level security, storage bucket
supabase/seed.sql            the twelve rooms and the kitchen menu
supabase/migration_002.sql   media + kiosk + ID card upgrade for existing databases
src/lib/                     types, roles, money and date helpers, email, data access
src/app/actions/             every write in the system, as server actions
src/app/(guest pages)        /, /rooms, /book, /pay, /find, /dining, /policy, /receipt
src/app/desk/                today, bookings, walk-in, room board, takings
src/app/admin/               settings, staff, rooms, menu, no-show list, profile
src/app/kiosk/               the reception tablet
public/photos/               the hotel photographs
```

## Notes before you take real money

- The Mobile Money step **prefills the dialler**; it is not an MTN API integration. A human
  confirms the payment at the desk, which is why "take payment" is a staff action. When you
  are ready for automatic confirmation, MTN MoMo Collections gives you a
  `requesttopay` call plus a webhook — drop it into `takePayment` and keep everything else.
- The service role key bypasses row level security. It belongs only in Vercel's environment
  variables and in `.env.local`, never in a client component.
- Set a real `NEXT_PUBLIC_SITE_URL` before switching email on, or the links in guest mail
  will point at the wrong host.
- Back-ups: Supabase → Database → Backups. Turn on daily backups before go-live.
