"use client";

import { useState } from "react";
import Link from "next/link";
import CopyButton from "./CopyButton";
import { reportPayment } from "@/app/actions/booking";
import { paymentAmounts, type PaymentMode } from "@/lib/payment";
import { dialHref, dialString, fcfa, normPhone } from "@/lib/util";
import type { Reservation, Settings } from "@/lib/types";

type GuestBill = Pick<Reservation, "code" | "total" | "paid" | "advance_due" | "advance_percent" | "payment_status" | "momo_ref" | "guest_name" | "guest_phone">;
type PaymentSettings = Pick<Settings, "momo_name" | "momo_number" | "momo_pattern" | "whatsapp">;

export default function GuestPayment({ bill, settings, initialMode, disabled = false }: {
  bill: GuestBill; settings: PaymentSettings; initialMode: PaymentMode; disabled?: boolean;
}) {
  const { balance, advance } = paymentAmounts(bill);
  const [choice, setChoice] = useState<PaymentMode>(initialMode);
  const mode = advance === 0 ? "full" : choice;
  const amount = mode === "full" ? balance : advance;
  const dial = dialString(settings, amount);
  const receiptHref = `/receipt/${bill.code}?${new URLSearchParams({ p: normPhone(bill.guest_phone) })}`;
  const wa = normPhone(settings.whatsapp)
    ? `https://wa.me/237${normPhone(settings.whatsapp)}?text=` + encodeURIComponent(
      `Kanton Hotel. Booking ${bill.code}. ${bill.guest_name}. ${mode === "full" ? "Full balance" : "Advance"}: ${fcfa(amount)}. Payment screenshot attached.`)
    : null;

  if (balance === 0) return <div className="panel pad" style={{ marginTop: 18 }}>
    <h2>Paid in full</h2><p>Your confirmed payments cover the full stay. Balance due: {fcfa(0)}.</p>
    <Link className="btn" href={receiptHref}>Print payment receipt</Link>
  </div>;

  if (disabled) return <div className="notice bad" style={{ marginTop: 18 }}>
    Payment is unavailable for this booking. Please contact reception before sending money.
  </div>;

  return (
    <div className="panel pad" style={{ marginTop: 18 }}>
      <h2>{advance > 0 ? "Reserve or pay in full" : "Pay the remaining balance"}</h2>
      {advance > 0 && <fieldset className="payment-choice">
        <legend>Payment amount</legend>
        <label className={"payment-option" + (mode === "reserve" ? " selected" : "")}>
          <input type="radio" name="pay-choice" value="reserve" checked={mode === "reserve"} onChange={() => setChoice("reserve")} />
          <span><b>Reserve with an advance</b><small>{fcfa(advance)} now. {fcfa(balance - advance)} left after confirmation.</small></span>
        </label>
        <label className={"payment-option" + (mode === "full" ? " selected" : "")}>
          <input type="radio" name="pay-choice" value="full" checked={mode === "full"} onChange={() => setChoice("full")} />
          <span><b>Pay in full</b><small>{fcfa(balance)} now. No balance after confirmation.</small></span>
        </label>
      </fieldset>}
      <div className="sumline due"><span>Amount to pay</span><b>{fcfa(amount)}</b></div>
      <p className="small muted">Mobile Money to {settings.momo_name}, {settings.momo_number}.
        Pay from your own phone, or give booking {bill.code} to reception to pay by cash or Mobile Money.</p>
      <div className="dial" style={{ margin: "14px 0" }}>{dial}</div>
      <div className="row">
        <a className="btn" href={dialHref(settings, amount)}>Pay {fcfa(amount)} from my phone</a>
        <CopyButton text={dial} label="Copy payment code" />
      </div>
      <p className="tiny muted" style={{ marginTop: 10 }}>Confirm the transfer with your Mobile Money PIN on your phone.
        Reception checks the payment before issuing your payment receipt.</p>
      <hr />
      <h3>Tell reception after you pay</h3>
      <form action={reportPayment}>
        <input type="hidden" name="code" value={bill.code} />
        <input type="hidden" name="paymentMode" value={mode} />
        <label className="field"><span>Mobile Money transaction ID</span>
          <input type="text" name="momoRef" defaultValue={bill.momo_ref} placeholder="Your payment reference" /></label>
        <div className="row">
          <button className="btn teal">I have paid. Tell reception</button>
          {wa && <a className="btn ghost" href={wa} target="_blank" rel="noopener noreferrer">Send screenshot on WhatsApp</a>}
        </div>
      </form>
      {bill.payment_status === "reported" && <div className="notice" style={{ marginTop: 12 }}>
        Payment reported{bill.momo_ref ? ` (${bill.momo_ref})` : ""}. Reception has not confirmed it yet. Keep your payment proof.
      </div>}
      <p style={{ marginTop: 18, marginBottom: 0 }}><Link href={receiptHref}>
        {bill.paid > 0 ? "Print payment receipt" : "Print reservation slip"}
      </Link></p>
    </div>
  );
}
