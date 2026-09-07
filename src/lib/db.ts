import { supabaseAdmin } from "./supabase/admin";
import type { MenuItem, Reservation, Room, Settings } from "./types";

export async function getSettings(): Promise<Settings> {
  const { data } = await supabaseAdmin().from("settings").select("*").eq("id", 1).single();
  return data as Settings;
}

export async function getRooms(onlyActive = false): Promise<Room[]> {
  let q = supabaseAdmin().from("rooms").select("*").order("number");
  if (onlyActive) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as Room[];
}

export async function getMenu(onlyAvailable = false): Promise<MenuItem[]> {
  let q = supabaseAdmin().from("menu_items").select("*").order("sort_order").order("name");
  if (onlyAvailable) q = q.eq("available", true);
  const { data } = await q;
  return (data ?? []) as MenuItem[];
}

export async function getReservations(): Promise<Reservation[]> {
  const { data } = await supabaseAdmin().from("reservations").select("*").order("check_in");
  return (data ?? []) as Reservation[];
}

export async function getReservationByCode(code: string): Promise<Reservation | null> {
  const { data } = await supabaseAdmin().from("reservations").select("*")
    .eq("code", code.toUpperCase().trim()).maybeSingle();
  return (data as Reservation) ?? null;
}

/**
 * Is the room already sold for these dates?
 * Only paid bookings (confirmed / in house) block a room — an unpaid
 * hold never does, which is the whole point of the house rule.
 */
export async function roomIsTaken(
  roomId: string, checkIn: string, checkOut: string, ignoreCode?: string
): Promise<boolean> {
  let q = supabaseAdmin().from("reservations").select("code")
    .eq("room_id", roomId)
    .in("status", ["confirmed", "checked_in"])
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);
  if (ignoreCode) q = q.neq("code", ignoreCode);
  const { data } = await q.limit(1);
  return !!(data && data.length);
}

/** Rooms free for a date range, cheapest first. */
export async function availableRooms(checkIn: string, checkOut: string): Promise<Room[]> {
  const rooms = await getRooms(true);
  const { data } = await supabaseAdmin().from("reservations").select("room_id")
    .in("status", ["confirmed", "checked_in"])
    .lt("check_in", checkOut).gt("check_out", checkIn);
  const busy = new Set((data ?? []).map((r) => r.room_id));
  return rooms.filter((r) => !busy.has(r.id)).sort((a, b) => a.price - b.price);
}

export async function pushHistory(id: string, what: string, by: string) {
  const sb = supabaseAdmin();
  const { data } = await sb.from("reservations").select("history").eq("id", id).single();
  const history = [...((data?.history as unknown[]) ?? []), { at: new Date().toISOString(), what, by }];
  await sb.from("reservations").update({ history, updated_at: new Date().toISOString() }).eq("id", id);
}
