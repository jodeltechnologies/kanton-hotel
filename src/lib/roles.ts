import type { Role } from "./types";

export const ROLES: Record<Role, { label: string; desc: string; perms: string[] }> = {
  owner: {
    label: "General manager (owner)",
    desc: "Runs the whole hotel: money settings, prices, staff accounts, every report.",
    perms: ["*"],
  },
  manager: {
    label: "Front office manager",
    desc: "Runs the desk: bookings, payments, rooms, menu, reports, cancellations.",
    perms: ["desk", "reservations", "payments", "checkin", "rooms", "menu", "reports", "cancel", "noshow", "blacklist"],
  },
  receptionist: {
    label: "Receptionist",
    desc: "Takes bookings, confirms payments, checks guests in and out, prints receipts.",
    perms: ["desk", "reservations", "payments", "checkin", "rooms"],
  },
  cashier: {
    label: "Cashier",
    desc: "Confirms payments, prints receipts and reads the day's takings.",
    perms: ["desk", "reservations", "payments", "reports"],
  },
  housekeeping: {
    label: "Housekeeping",
    desc: "Sees the room board and marks rooms clean, dirty or under repair.",
    perms: ["desk", "rooms"],
  },
};

export function can(role: Role | undefined, perm: string): boolean {
  if (!role) return false;
  const r = ROLES[role];
  if (!r) return false;
  return r.perms.includes("*") || r.perms.includes(perm);
}
