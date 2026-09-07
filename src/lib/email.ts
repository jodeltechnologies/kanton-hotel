import type { Reservation, Settings } from "./types";
import { dialString, fcfa, prettyDate } from "./util";

/**
 * Sends mail through Resend. If RESEND_API_KEY is not set the app
 * carries on quietly — email is a courtesy, never a blocker.
 */
export async function sendMail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) return false;
  const from = process.env.MAIL_FROM || "Kanton Hotel <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [opts.to], subject: opts.subject, html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const wrap = (s: Settings, body: string) => `
<div style="font-family:Helvetica,Arial,sans-serif;color:#14202E;max-width:600px;margin:0 auto;border-top:4px solid #A80F22">
  <div style="background:#0D1826;padding:18px 24px">
    <img src="${siteUrl()}/logo-on-dark.png" alt="${s.hotel_name}" width="230"
         style="display:block;width:230px;max-width:70%;height:auto">
    <div style="color:#93A5B8;font-size:12px;letter-spacing:.16em;margin-top:8px">KUMBA · KRAMMER AVENUE</div>
  </div>
  <div style="padding:24px;background:#fff">${body}</div>
  <div style="padding:16px 24px;background:#E9F1FA;font-size:12px;color:#5B6A7D">
    ${s.address} · ${s.po_box} · ${s.phone}<br>
    Free unlimited internet and a smart TV in every room. Checkout ${s.checkout_time}.
  </div>
</div>`;

const lines = (r: Reservation) => `
<table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0">
  <tr><td style="padding:6px 0;border-bottom:1px solid #eee">Room ${r.room_label} — ${r.room_name} × ${r.nights} night${r.nights > 1 ? "s" : ""}</td>
      <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${fcfa(r.room_total)}</td></tr>
  ${r.food.map((f) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${f.name} × ${f.qty}</td>
      <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${fcfa(f.price * f.qty)}</td></tr>`).join("")}
  <tr><td style="padding:8px 0"><b>Total</b></td><td style="padding:8px 0;text-align:right"><b>${fcfa(r.total)}</b></td></tr>
</table>`;

/** Sent the moment a booking is made online. */
export function bookingEmail(r: Reservation, s: Settings, siteUrl: string) {
  const dial = dialString(s, r.advance_due);
  return {
    subject: `Booking ${r.code} — ${s.hotel_name}`,
    html: wrap(s, `
      <p style="font-size:15px">Dear ${r.guest_name},</p>
      <p style="font-size:15px">Your room is reserved under the code
        <b style="font-size:18px;letter-spacing:.06em">${r.code}</b>. Keep it — reception finds your file with it.</p>
      <p style="font-size:15px;margin:0">Room ${r.room_label} · ${r.room_name}<br>
        ${prettyDate(r.check_in)} → ${prettyDate(r.check_out)} · ${r.guests} guest${r.guests > 1 ? "s" : ""}</p>
      ${lines(r)}
      <div style="background:#FAE6E8;border-left:3px solid #A80F22;padding:14px 16px;margin:16px 0">
        <b>Pay ${fcfa(r.advance_due)} to hold the room (${r.advance_percent}% advance).</b><br>
        Dial <b style="font-size:16px">${dial}</b> on your phone and confirm with your Mobile Money PIN.<br>
        Money goes to ${s.momo_name} · ${s.momo_number}.
      </div>
      <p style="font-size:14px">Then send the screenshot on WhatsApp to ${s.phone}, or add your transaction ID here:<br>
        <a href="${siteUrl}/pay/${r.code}" style="color:#A80F22">${siteUrl}/pay/${r.code}</a></p>
      <p style="font-size:13px;color:#5E6E69">${s.policy_text}</p>`),
  };
}

/** Sent when reception records money against the booking. */
export function paymentEmail(r: Reservation, s: Settings, amount: number, receiptNo: string, siteUrl: string) {
  const balance = Math.max(0, r.total - r.paid);
  return {
    subject: `Payment received — booking ${r.code}`,
    html: wrap(s, `
      <p style="font-size:15px">Dear ${r.guest_name},</p>
      <p style="font-size:15px">We have received <b>${fcfa(amount)}</b> against booking
        <b>${r.code}</b>. Receipt number ${receiptNo}.</p>
      ${lines(r)}
      <p style="font-size:15px">Received so far: <b>${fcfa(r.paid)}</b>.
        ${balance > 0 ? `Balance of <b>${fcfa(balance)}</b> is paid at the desk on arrival.` : "Your stay is paid in full."}</p>
      <p style="font-size:15px">Room ${r.room_label} is now locked to your name for
        ${prettyDate(r.check_in)} → ${prettyDate(r.check_out)}.</p>
      <p style="font-size:14px"><a href="${siteUrl}/receipt/${r.code}?p=${r.guest_phone.replace(/[^0-9]/g, "")}"
        style="color:#A80F22">Open your receipt</a></p>`),
  };
}

export const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
