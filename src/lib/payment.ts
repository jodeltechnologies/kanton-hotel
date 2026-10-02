import type { Reservation } from "./types";

export type PaymentMode = "reserve" | "full";

export const paymentMode = (value: unknown): PaymentMode => value === "full" ? "full" : "reserve";

export function preferredPaymentMode(r: Pick<Reservation, "history">): PaymentMode {
  const choice = [...(r.history ?? [])].reverse().find((entry) => entry.what.startsWith("Payment choice: "));
  return choice?.what === "Payment choice: full" ? "full" : "reserve";
}

/** Only money recorded by reception counts towards the amount received. */
export function paymentAmounts(r: Pick<Reservation, "total" | "paid" | "advance_due">) {
  const balance = Math.max(0, r.total - r.paid);
  return { balance, advance: Math.min(balance, Math.max(0, r.advance_due - r.paid)) };
}
