import type { Reservation, Settings } from "./types";

export const money = (n: number) =>
  Math.round(Number(n) || 0).toLocaleString("fr-FR").replace(/\u202f/g, " ");
export const fcfa = (n: number) => money(n) + " FCFA";

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
export const nightsBetween = (a: string, b: string) =>
  Math.max(0, Math.round((+new Date(b + "T12:00:00") - +new Date(a + "T12:00:00")) / 86400000));

export const prettyDate = (iso?: string | null) =>
  !iso ? "—" : new Date(iso + "T12:00:00").toLocaleDateString("en-GB",
    { weekday: "short", day: "numeric", month: "short", year: "numeric" });
export const shortDate = (iso?: string | null) =>
  !iso ? "—" : new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
export const stamp = (v?: string | number | null) =>
  !v ? "—" : new Date(v).toLocaleString("en-GB",
    { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export const normPhone = (p: string) => String(p || "").replace(/[^0-9]/g, "").replace(/^237/, "");
export const titleCase = (s: string) => String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Room media is either one of the photographs shipped with the site
 * ("bed", "lobby"…) or a file the manager uploaded to Supabase Storage,
 * which arrives as a full URL.
 */
export const mediaUrl = (key: string) =>
  /^(https?:|\/)/.test(key) ? key : `/photos/${key}.jpg`;
export const photoUrl = mediaUrl;
export const isVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

export const SOURCE_LABEL: Record<string, string> = {
  online: "online", "walk-in": "at the desk", kiosk: "on the reception tablet",
};

export const ID_TYPES = [
  "National ID card", "Passport", "Driver's licence", "Voter's card", "Residence permit",
];

export const advanceFor = (total: number, percent: number) => Math.round((total * percent) / 100);

/** The Mobile Money string the guest's phone should dial. */
export function dialString(s: Pick<Settings, "momo_pattern" | "momo_number">, amount: number) {
  return (s.momo_pattern || "*126*9*{number}*{amount}#")
    .replace("{number}", normPhone(s.momo_number) || s.momo_number)
    .replace("{amount}", String(Math.round(amount)));
}
/** tel: link — the # has to be percent-encoded or the dialler drops it. */
export const dialHref = (s: Pick<Settings, "momo_pattern" | "momo_number">, amount: number) =>
  "tel:" + encodeURIComponent(dialString(s, amount)).replace(/%2A/g, "*");

export function makeCode() {
  const l = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const p = () => l[Math.floor(Math.random() * l.length)];
  return "KTN-" + p() + p() + String(Math.floor(Math.random() * 9000) + 1000);
}
export function receiptNumber() {
  const d = new Date();
  return "KH" + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0") + "-" + Math.floor(Math.random() * 9000 + 1000);
}

export const isHoldExpired = (r: Reservation) =>
  r.status === "held" && !!r.hold_until && Date.now() > +new Date(r.hold_until);

export const RES_LABEL: Record<string, string> = {
  held: "Awaiting advance", confirmed: "Confirmed", checked_in: "In house",
  checked_out: "Checked out", cancelled: "Cancelled", no_show: "No-show",
};
export const ROOM_LABEL: Record<string, string> = {
  available: "Available", occupied: "Occupied", cleaning: "Being cleaned", maintenance: "Under repair",
};
