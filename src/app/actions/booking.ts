"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getMenu, getRooms, getSettings, getReservationByCode, roomIsTaken, pushHistory } from "@/lib/db";
import { advanceFor, makeCode, nightsBetween, normPhone } from "@/lib/util";
import { bookingEmail, sendMail, siteUrl } from "@/lib/email";
import type { FoodLine, Reservation } from "@/lib/types";

export type FormState = { error?: string };

/**
 * Creates a booking from the guest site, the reception tablet or the desk.
 * Prices, nights and the advance are recomputed here from the database —
 * nothing money-related is trusted from the form.
 */
export async function createBooking(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = String(fd.get("source") ?? "online");
  const source = raw === "walk-in" || raw === "kiosk" ? raw : "online";
  const name = String(fd.get("name") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const roomId = String(fd.get("roomId") ?? "");
  const checkIn = String(fd.get("checkIn") ?? "");
  const checkOut = String(fd.get("checkOut") ?? "");
  const guests = Number(fd.get("guests") ?? 1) || 1;
  const arrival = String(fd.get("arrival") ?? "afternoon");
  const note = String(fd.get("note") ?? "").trim();
  const id_card_type = String(fd.get("idType") ?? "");
  const id_card_number = String(fd.get("idNumber") ?? "").trim();
  const wanted: Record<string, number> = JSON.parse(String(fd.get("food") ?? "{}"));

  if (!name || normPhone(phone).length < 8) return { error: "Put a full name and a working phone number." };
  if (!roomId) return { error: "Choose a room." };
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return { error: "The leaving date has to be after the arrival date." };
  if (source !== "walk-in" && fd.get("agree") !== "on")
    return { error: "Tick the booking rules before you continue." };

  const sb = supabaseAdmin();
  const settings = await getSettings();

  const { data: ban } = await sb.from("blacklist").select("*").eq("phone", normPhone(phone)).maybeSingle();
  if (source !== "walk-in" && ban && (ban.banned || ban.strikes >= settings.strike_limit))
    return {
      error: source === "kiosk"
        ? `This number has ${ban.strikes} no-shows on file. Please speak to the receptionist — the stay has to be paid in full at the desk.`
        : `This number cannot book online after ${ban.strikes} no-shows. Call ${settings.phone}.`,
    };

  const room = (await getRooms()).find((r) => r.id === roomId);
  if (!room || !room.active) return { error: "That room is no longer on sale." };
  if (await roomIsTaken(room.id, checkIn, checkOut))
    return { error: "Somebody has already paid for that room on those dates. Pick another room or shift your dates." };

  const menu = await getMenu(true);
  const food: FoodLine[] = Object.entries(wanted)
    .filter(([, q]) => Number(q) > 0)
    .map(([id, qty]) => {
      const m = menu.find((x) => x.id === id);
      return m ? { id, name: m.name, price: m.price, qty: Number(qty) } : null;
    })
    .filter(Boolean) as FoodLine[];

  const food_total = food.reduce((a, f) => a + f.price * f.qty, 0);
  const room_total = room.price * nights;
  const total = room_total + food_total;
  const advance_due = advanceFor(total, settings.advance_percent);
  const code = makeCode();

  const { data: created, error } = await sb.from("reservations").insert({
    code, source,
    guest_name: name, guest_phone: phone, guest_email: email,
    room_id: room.id, room_label: room.number, room_name: room.name, room_price: room.price,
    check_in: checkIn, check_out: checkOut, nights, guests, arrival, note,
    id_card_type, id_card_number,
    food, food_total, room_total, total,
    advance_percent: settings.advance_percent, advance_due,
    hold_until: new Date(Date.now() + settings.hold_hours * 3600000).toISOString(),
    history: [{ at: new Date().toISOString(), what: `Booking created (${source})`, by: name }],
  }).select("*").single();
  if (error || !created) return { error: "The booking could not be saved: " + (error?.message ?? "") };

  // Email confirmation for anyone who left an address.
  if (email) {
    const mail = bookingEmail(created as Reservation, settings, siteUrl());
    const sent = await sendMail({ to: email, replyTo: settings.email || undefined, ...mail });
    if (sent) await sb.from("reservations").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", created.id);
  }

  revalidatePath("/desk");
  revalidatePath("/desk/reservations");
  if (source === "walk-in") redirect(`/desk/booking/${code}`);
  if (source === "kiosk") redirect(`/kiosk/${code}`);
  redirect(`/pay/${code}`);
}

/** The guest tells reception they have paid, with their transaction ID. */
export async function reportPayment(fd: FormData) {
  const code = String(fd.get("code") ?? "");
  const ref = String(fd.get("momoRef") ?? "").trim();
  const r = await getReservationByCode(code);
  if (!r) return;
  await supabaseAdmin().from("reservations")
    .update({ payment_status: "reported", momo_ref: ref, updated_at: new Date().toISOString() })
    .eq("id", r.id);
  await pushHistory(r.id, `Guest reported a Mobile Money payment${ref ? ` (${ref})` : ""}`, r.guest_name);
  revalidatePath(`/pay/${code}`);
  revalidatePath("/desk");
}

/** Guest cancels their own booking from the lookup page. */
export async function guestCancel(fd: FormData) {
  const code = String(fd.get("code") ?? "");
  const r = await getReservationByCode(code);
  if (!r || !["held", "confirmed"].includes(r.status)) return;
  await supabaseAdmin().from("reservations")
    .update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", r.id);
  await pushHistory(r.id, "Cancelled by the guest", r.guest_name);
  revalidatePath("/find");
  revalidatePath("/desk");
}

/** Unlocks the reception tablet for 30 days on this device. */
export async function unlockKiosk(_prev: FormState, fd: FormData): Promise<FormState> {
  const pin = String(fd.get("pin") ?? "").trim();
  const s = await getSettings();
  if (!pin || pin !== s.kiosk_pin) return { error: "Wrong PIN. Ask the receptionist." };
  const store = await cookies();
  store.set("kanton_kiosk", "1", {
    httpOnly: true, sameSite: "lax", path: "/",
    maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === "production",
  });
  redirect("/kiosk");
}

export async function lockKiosk() {
  const store = await cookies();
  store.delete("kanton_kiosk");
  redirect("/kiosk");
}
