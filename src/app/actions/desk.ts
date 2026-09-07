"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { getReservationByCode, getRooms, pushHistory, roomIsTaken, getSettings } from "@/lib/db";
import { advanceFor, normPhone, receiptNumber } from "@/lib/util";
import { paymentEmail, sendMail, siteUrl } from "@/lib/email";
import type { Reservation } from "@/lib/types";

const touch = (code: string) => {
  revalidatePath("/desk");
  revalidatePath("/desk/reservations");
  revalidatePath(`/desk/booking/${code}`);
};

/** Record money received and mint a receipt number. */
export async function takePayment(fd: FormData) {
  const staff = await requireStaff("payments");
  const code = String(fd.get("code") ?? "");
  const amount = Math.round(Number(fd.get("amount") ?? 0));
  const method = String(fd.get("method") ?? "Cash");
  const reference = String(fd.get("reference") ?? "").trim();
  const r = await getReservationByCode(code);
  if (!r || amount <= 0) return;

  const receipt_no = receiptNumber();
  await supabaseAdmin().from("payments").insert({
    reservation_id: r.id, receipt_no, amount, method, reference,
    taken_by: staff.id, taken_by_name: staff.full_name,
  });
  await pushHistory(r.id, `Payment of ${amount} FCFA (${method}) recorded`, staff.full_name);

  // Tell the guest, if we have an address for them.
  const fresh = await getReservationByCode(code);
  if (fresh?.guest_email) {
    const s = await getSettings();
    const mail = paymentEmail(fresh as Reservation, s, amount, receipt_no, siteUrl());
    await sendMail({ to: fresh.guest_email, replyTo: s.email || undefined, ...mail });
  }

  touch(code);
  redirect(`/receipt/${code}?r=${receipt_no}`);
}

/**
 * Check-in. The ID card is recorded here — the law and the police
 * register both want it, and it is the last moment we have the card
 * in our hands.
 */
export async function checkIn(fd: FormData) {
  const staff = await requireStaff("checkin");
  const code = String(fd.get("code") ?? "");
  const id_card_type = String(fd.get("idType") ?? "").trim();
  const id_card_number = String(fd.get("idNumber") ?? "").trim().toUpperCase();
  const r = await getReservationByCode(code);
  if (!r) return;
  if (!id_card_number) redirect(`/desk/booking/${code}?needid=1`);

  const sb = supabaseAdmin();
  await sb.from("reservations").update({
    status: "checked_in",
    id_card_type: id_card_type || "National ID card",
    id_card_number,
    checked_in_at: new Date().toISOString(),
    checked_in_by: staff.full_name,
    updated_at: new Date().toISOString(),
  }).eq("id", r.id);
  if (r.room_id) await sb.from("rooms").update({ status: "occupied" }).eq("id", r.room_id);
  await pushHistory(r.id, `Checked in · ${id_card_type || "ID"} ${id_card_number}`, staff.full_name);
  touch(code); revalidatePath("/desk/rooms");
}

export async function checkOut(fd: FormData) {
  const staff = await requireStaff("checkin");
  const code = String(fd.get("code") ?? "");
  const r = await getReservationByCode(code);
  if (!r) return;
  const sb = supabaseAdmin();
  await sb.from("reservations").update({
    status: "checked_out", checked_out_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", r.id);
  if (r.room_id) await sb.from("rooms").update({ status: "cleaning" }).eq("id", r.room_id);
  await pushHistory(r.id, "Checked out", staff.full_name);
  touch(code); revalidatePath("/desk/rooms");
}

/** Moves a booking to another room and reprices it. */
export async function moveRoom(fd: FormData) {
  const staff = await requireStaff("reservations");
  const code = String(fd.get("code") ?? "");
  const roomId = String(fd.get("roomId") ?? "");
  const r = await getReservationByCode(code);
  const room = (await getRooms(true)).find((x) => x.id === roomId);
  if (!r || !room) return;
  if (await roomIsTaken(room.id, r.check_in, r.check_out, r.code)) return;

  const sb = supabaseAdmin();
  const settings = await getSettings();
  const room_total = room.price * r.nights;
  const total = room_total + r.food_total;
  if (r.status === "checked_in") {
    if (r.room_id) await sb.from("rooms").update({ status: "cleaning" }).eq("id", r.room_id);
    await sb.from("rooms").update({ status: "occupied" }).eq("id", room.id);
  }
  await sb.from("reservations").update({
    room_id: room.id, room_label: room.number, room_name: room.name, room_price: room.price,
    room_total, total, advance_due: advanceFor(total, settings.advance_percent),
    updated_at: new Date().toISOString(),
  }).eq("id", r.id);
  await pushHistory(r.id, `Moved from room ${r.room_label} to ${room.number}`, staff.full_name);
  touch(code); revalidatePath("/desk/rooms");
}

/** No-show: room back on sale, advance kept, strike on the phone number. */
export async function markNoShow(fd: FormData) {
  const staff = await requireStaff("noshow");
  const code = String(fd.get("code") ?? "");
  const r = await getReservationByCode(code);
  if (!r) return;
  const sb = supabaseAdmin();
  const settings = await getSettings();
  await sb.from("reservations").update({ status: "no_show", updated_at: new Date().toISOString() }).eq("id", r.id);

  const phone = normPhone(r.guest_phone);
  const { data: row } = await sb.from("blacklist").select("*").eq("phone", phone).maybeSingle();
  const strikes = (row?.strikes ?? 0) + 1;
  await sb.from("blacklist").upsert({
    phone, name: r.guest_name, strikes,
    banned: row?.banned || strikes >= settings.strike_limit,
    reason: `Did not arrive for ${r.code}`, last_at: new Date().toISOString(),
  }, { onConflict: "phone" });

  await pushHistory(r.id, "Marked as a no-show", staff.full_name);
  touch(code); revalidatePath("/admin/blacklist");
}

export async function cancelBooking(fd: FormData) {
  const staff = await requireStaff("cancel");
  const code = String(fd.get("code") ?? "");
  const r = await getReservationByCode(code);
  if (!r) return;
  await supabaseAdmin().from("reservations")
    .update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", r.id);
  await pushHistory(r.id, "Cancelled at the desk", staff.full_name);
  touch(code);
}

export async function setRoomStatus(fd: FormData) {
  await requireStaff("rooms");
  const id = String(fd.get("roomId") ?? "");
  const status = String(fd.get("status") ?? "available");
  await supabaseAdmin().from("rooms").update({ status }).eq("id", id);
  revalidatePath("/desk/rooms"); revalidatePath("/rooms");
}
