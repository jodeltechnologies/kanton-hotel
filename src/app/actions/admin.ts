"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { requireStaff, currentStaff } from "@/lib/auth";
import type { Role } from "@/lib/types";

export type FormState = { error?: string; ok?: string };

/* ---------------- sign in / out ---------------- */
export async function signIn(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const next = String(fd.get("next") ?? "/desk");
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password do not match an account." };

  const { data: staff } = await supabaseAdmin().from("staff").select("*").eq("id", data.user.id).single();
  if (!staff || !staff.active) {
    await sb.auth.signOut();
    return { error: "This account is switched off. Ask the owner." };
  }
  await supabaseAdmin().from("staff").update({ last_login: new Date().toISOString() }).eq("id", data.user.id);
  redirect(next);
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/");
}

/* ---------------- first-run setup ---------------- */
/** Creates the very first owner account. Refuses once staff exist. */
export async function bootstrapOwner(_prev: FormState, fd: FormData): Promise<FormState> {
  const sb = supabaseAdmin();
  const { count } = await sb.from("staff").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return { error: "The hotel already has staff accounts. Sign in instead." };

  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const full_name = String(fd.get("full_name") ?? "").trim();
  if (!email || password.length < 8 || !full_name)
    return { error: "Give a name, an email and a password of at least 8 characters." };

  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) return { error: error?.message ?? "The account could not be created." };
  await sb.from("staff").insert({
    id: data.user.id, username: email.split("@")[0], full_name, role: "owner", active: true,
  });
  redirect("/login?created=1");
}

/* ---------------- settings ---------------- */
export async function saveSettings(fd: FormData) {
  await requireStaff("*");
  const num = (k: string, d: number) => Number(fd.get(k) ?? d) || d;
  await supabaseAdmin().from("settings").update({
    hotel_name: String(fd.get("hotel_name") ?? ""),
    tagline: String(fd.get("tagline") ?? ""),
    address: String(fd.get("address") ?? ""),
    po_box: String(fd.get("po_box") ?? ""),
    phone: String(fd.get("phone") ?? ""),
    whatsapp: String(fd.get("whatsapp") ?? ""),
    email: String(fd.get("email") ?? ""),
    checkout_time: String(fd.get("checkout_time") ?? ""),
    momo_number: String(fd.get("momo_number") ?? ""),
    momo_name: String(fd.get("momo_name") ?? ""),
    momo_pattern: String(fd.get("momo_pattern") ?? "*126*9*{number}*{amount}#"),
    advance_percent: Math.min(100, Math.max(0, num("advance_percent", 40))),
    hold_hours: num("hold_hours", 6),
    arrival_grace_hours: num("arrival_grace_hours", 24),
    cancel_window_hours: num("cancel_window_hours", 24),
    strike_limit: num("strike_limit", 2),
    policy_text: String(fd.get("policy_text") ?? ""),
    owner_name: String(fd.get("owner_name") ?? ""),
    owner_phone: String(fd.get("owner_phone") ?? ""),
    kiosk_pin: String(fd.get("kiosk_pin") ?? "2468"),
    mail_from: String(fd.get("mail_from") ?? ""),
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  revalidatePath("/", "layout");
}

/* ---------------- staff accounts ---------------- */
export async function createStaff(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireStaff("*");
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const full_name = String(fd.get("full_name") ?? "").trim();
  const role = String(fd.get("role") ?? "receptionist") as Role;
  const phone = String(fd.get("phone") ?? "").trim();
  if (!email || !full_name) return { error: "A name and an email address are needed." };
  if (password.length < 8) return { error: "Give them a password of at least 8 characters." };

  const sb = supabaseAdmin();
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) return { error: error?.message ?? "The account could not be created." };
  const { error: e2 } = await sb.from("staff").insert({
    id: data.user.id, username: email.split("@")[0], full_name, phone, role, active: true,
  });
  if (e2) {
    await sb.auth.admin.deleteUser(data.user.id);
    return { error: e2.message };
  }
  revalidatePath("/admin/staff");
  return { ok: `${full_name} can now sign in with ${email}.` };
}

export async function updateStaff(fd: FormData) {
  await requireStaff("*");
  const id = String(fd.get("id") ?? "");
  await supabaseAdmin().from("staff").update({
    full_name: String(fd.get("full_name") ?? ""),
    phone: String(fd.get("phone") ?? ""),
    role: String(fd.get("role") ?? "receptionist"),
  }).eq("id", id);
  revalidatePath("/admin/staff");
}

export async function toggleStaff(fd: FormData) {
  await requireStaff("*");
  const id = String(fd.get("id") ?? "");
  const active = String(fd.get("active") ?? "true") === "true";
  await supabaseAdmin().from("staff").update({ active: !active }).eq("id", id);
  revalidatePath("/admin/staff");
}

export async function deleteStaff(fd: FormData) {
  const me = await requireStaff("*");
  const id = String(fd.get("id") ?? "");
  if (id === me.id) return;
  const sb = supabaseAdmin();
  await sb.from("staff").delete().eq("id", id);
  await sb.auth.admin.deleteUser(id);
  revalidatePath("/admin/staff");
}

export async function resetPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireStaff("*");
  const id = String(fd.get("id") ?? "");
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "At least 8 characters." };
  const { error } = await supabaseAdmin().auth.admin.updateUserById(id, { password });
  return error ? { error: error.message } : { ok: "Password changed. Tell them the new one." };
}

/* ---------------- my profile ---------------- */
export async function saveProfile(fd: FormData) {
  const me = await requireStaff();
  await supabaseAdmin().from("staff").update({
    full_name: String(fd.get("full_name") ?? me.full_name),
    phone: String(fd.get("phone") ?? ""),
  }).eq("id", me.id);
  revalidatePath("/admin/profile");
}

export async function changeMyPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await currentStaff();
  if (!me) return { error: "Sign in first." };
  const password = String(fd.get("password") ?? "");
  const again = String(fd.get("password2") ?? "");
  if (password.length < 8) return { error: "At least 8 characters." };
  if (password !== again) return { error: "The two passwords are different." };
  const { error } = await supabaseAdmin().auth.admin.updateUserById(me.id, { password });
  return error ? { error: error.message } : { ok: "Password changed." };
}

/* ---------------- rooms ---------------- */
export async function saveRoom(fd: FormData) {
  await requireStaff("rooms");
  const id = String(fd.get("id") ?? "");
  const row = {
    number: String(fd.get("number") ?? "").trim(),
    name: String(fd.get("name") ?? "Room"),
    category: String(fd.get("category") ?? "standard"),
    price: Math.max(0, Number(fd.get("price") ?? 0)),
    floor: Number(fd.get("floor") ?? 1),
    capacity: Number(fd.get("capacity") ?? 2),
    bed: String(fd.get("bed") ?? "1 queen bed"),
    description: String(fd.get("description") ?? ""),
    amenities: String(fd.get("amenities") ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    photos: fd.getAll("photos").map(String).filter(Boolean),
    videos: fd.getAll("videos").map(String).filter(Boolean),
    status: String(fd.get("status") ?? "available"),
    active: fd.get("active") === "on",
  };
  if (!row.number) return;
  if (!row.photos.length) row.photos = ["bed"];
  const sb = supabaseAdmin();
  if (id) await sb.from("rooms").update(row).eq("id", id);
  else await sb.from("rooms").insert(row);
  revalidatePath("/admin/rooms"); revalidatePath("/rooms"); revalidatePath("/");
}

/* ---------------- room photos and video ---------------- */
const BUCKET = "room-media";
const MAX_IMAGE = 8 * 1024 * 1024;   // 8 MB
const MAX_VIDEO = 60 * 1024 * 1024;  // 60 MB

/** Uploads photographs or a walk-through video for one room. */
export async function uploadRoomMedia(fd: FormData): Promise<void> {
  await requireStaff("rooms");
  const roomId = String(fd.get("id") ?? "");
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!roomId || !files.length) return;

  const sb = supabaseAdmin();
  const { data: room } = await sb.from("rooms").select("photos, videos").eq("id", roomId).single();
  if (!room) return;
  const photos = [...(room.photos ?? [])];
  const videos = [...(room.videos ?? [])];

  for (const file of files) {
    const isVid = file.type.startsWith("video/");
    if (!isVid && !file.type.startsWith("image/")) continue;
    if (file.size > (isVid ? MAX_VIDEO : MAX_IMAGE)) continue;
    const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
    const path = `${roomId}/${Date.now()}-${safe}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      contentType: file.type, upsert: false, cacheControl: "31536000",
    });
    if (error) continue;
    const url = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    (isVid ? videos : photos).push(url);
  }

  await sb.from("rooms").update({ photos, videos }).eq("id", roomId);
  revalidatePath("/admin/rooms"); revalidatePath("/rooms"); revalidatePath("/");
}

/** Removes one photo or video from a room, and from storage if we own it. */
export async function deleteRoomMedia(fd: FormData): Promise<void> {
  await requireStaff("rooms");
  const roomId = String(fd.get("id") ?? "");
  const url = String(fd.get("url") ?? "");
  const sb = supabaseAdmin();
  const { data: room } = await sb.from("rooms").select("photos, videos").eq("id", roomId).single();
  if (!room) return;

  const photos = (room.photos ?? []).filter((p: string) => p !== url);
  const videos = (room.videos ?? []).filter((v: string) => v !== url);
  await sb.from("rooms").update({ photos: photos.length ? photos : ["bed"], videos }).eq("id", roomId);

  const marker = `/${BUCKET}/`;
  if (url.includes(marker)) {
    const path = url.split(marker)[1]?.split("?")[0];
    if (path) await sb.storage.from(BUCKET).remove([decodeURIComponent(path)]);
  }
  revalidatePath("/admin/rooms"); revalidatePath("/rooms");
}

export async function deleteRoom(fd: FormData) {
  await requireStaff("rooms");
  const id = String(fd.get("id") ?? "");
  const sb = supabaseAdmin();
  const { data } = await sb.from("reservations").select("code")
    .eq("room_id", id).in("status", ["held", "confirmed", "checked_in"]).limit(1);
  if (data && data.length) return; // live bookings — move them first
  await sb.from("rooms").delete().eq("id", id);
  revalidatePath("/admin/rooms"); revalidatePath("/rooms");
}

/* ---------------- menu ---------------- */
export async function saveFood(fd: FormData) {
  await requireStaff("menu");
  const id = String(fd.get("id") ?? "");
  const row = {
    name: String(fd.get("name") ?? "").trim(),
    price: Math.max(0, Number(fd.get("price") ?? 0)),
    category: String(fd.get("category") ?? "Main dishes").trim(),
    description: String(fd.get("description") ?? ""),
    available: fd.get("available") === "on",
  };
  if (!row.name) return;
  const sb = supabaseAdmin();
  if (id) await sb.from("menu_items").update(row).eq("id", id);
  else await sb.from("menu_items").insert(row);
  revalidatePath("/admin/menu"); revalidatePath("/dining");
}

export async function deleteFood(fd: FormData) {
  await requireStaff("menu");
  await supabaseAdmin().from("menu_items").delete().eq("id", String(fd.get("id") ?? ""));
  revalidatePath("/admin/menu"); revalidatePath("/dining");
}

/* ---------------- no-show list ---------------- */
export async function updateBlacklist(fd: FormData) {
  await requireStaff("blacklist");
  const id = String(fd.get("id") ?? "");
  const what = String(fd.get("what") ?? "");
  const sb = supabaseAdmin();
  if (what === "forgive") await sb.from("blacklist").update({ strikes: 0, banned: false }).eq("id", id);
  if (what === "toggle") {
    const { data } = await sb.from("blacklist").select("banned").eq("id", id).single();
    await sb.from("blacklist").update({ banned: !data?.banned }).eq("id", id);
  }
  revalidatePath("/admin/blacklist");
}
