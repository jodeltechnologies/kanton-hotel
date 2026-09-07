import { requireStaff } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { saveSettings } from "@/app/actions/admin";
import { dialString } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  await requireStaff("*");
  const s = await getSettings();
  const sample = dialString(s, Math.round((25000 * s.advance_percent) / 100));

  return (
    <form action={saveSettings}>
      <h2>Hotel settings</h2>
      <p className="small muted">What guests see, and the money rules the whole system follows.</p>

      <div className="grid g2" style={{ marginTop: 18, alignItems: "start" }}>
        <div>
          <fieldset><legend>The house</legend>
            <label className="field"><span>Hotel name</span>
              <input type="text" name="hotel_name" defaultValue={s.hotel_name} /></label>
            <label className="field"><span>One line for the home page</span>
              <input type="text" name="tagline" defaultValue={s.tagline} /></label>
            <div className="grid g2" style={{ gap: "0 12px" }}>
              <label className="field"><span>Street</span><input type="text" name="address" defaultValue={s.address} /></label>
              <label className="field"><span>P.O. Box</span><input type="text" name="po_box" defaultValue={s.po_box} /></label>
              <label className="field"><span>Phone</span><input type="tel" name="phone" defaultValue={s.phone} /></label>
              <label className="field"><span>WhatsApp number for screenshots</span>
                <input type="tel" name="whatsapp" defaultValue={s.whatsapp} /></label>
              <label className="field"><span>Email</span><input type="email" name="email" defaultValue={s.email} /></label>
              <label className="field"><span>Checkout time</span>
                <input type="text" name="checkout_time" defaultValue={s.checkout_time} /></label>
            </div>
          </fieldset>

          <fieldset><legend>Booking rules</legend>
            <div className="grid g2" style={{ gap: "0 12px" }}>
              <label className="field"><span>Advance to hold a room (%)</span>
                <input type="number" name="advance_percent" min={0} max={100} defaultValue={s.advance_percent} /></label>
              <label className="field"><span>Hours to pay before the hold drops</span>
                <input type="number" name="hold_hours" min={1} max={168} defaultValue={s.hold_hours} /></label>
              <label className="field"><span>Hours late before it is a no-show</span>
                <input type="number" name="arrival_grace_hours" min={1} max={168} defaultValue={s.arrival_grace_hours} /></label>
              <label className="field"><span>Free-cancellation window (hours)</span>
                <input type="number" name="cancel_window_hours" min={0} max={336} defaultValue={s.cancel_window_hours} /></label>
              <label className="field"><span>No-shows before a number is blocked</span>
                <input type="number" name="strike_limit" min={1} max={10} defaultValue={s.strike_limit} /></label>
            </div>
            <label className="field"><span>The sentence guests read before they agree</span>
              <textarea name="policy_text" defaultValue={s.policy_text} /></label>
          </fieldset>
        </div>

        <div>
          <fieldset><legend>Mobile Money</legend>
            <label className="field"><span>Number that receives the money</span>
              <input type="tel" name="momo_number" defaultValue={s.momo_number} /></label>
            <label className="field"><span>Name on the account</span>
              <input type="text" name="momo_name" defaultValue={s.momo_name} /></label>
            <label className="field"><span>Dial pattern</span>
              <input type="text" name="momo_pattern" defaultValue={s.momo_pattern} /></label>
            <p className="tiny muted">
              Keep <b>{"{number}"}</b> and <b>{"{amount}"}</b> in the pattern — the system fills them in.
              MTN MoMo is <b>*126*9*{"{number}"}*{"{amount}"}#</b>.
            </p>
            <p className="small" style={{ marginTop: 10 }}>A guest owing an advance on a 25 000 FCFA stay would dial:</p>
            <div className="dial">{sample}</div>
          </fieldset>

          <fieldset><legend>Reception tablet</legend>
            <p className="small muted">
              The tablet on the desk runs <b>/kiosk</b>. A guest standing at reception picks a free room there and
              gets a booking code straight away. The PIN unlocks the tablet once, then it stays unlocked for 30 days.
            </p>
            <label className="field"><span>Tablet PIN</span>
              <input type="text" name="kiosk_pin" defaultValue={s.kiosk_pin} inputMode="numeric" /></label>
            <a className="btn ghost sm" href="/kiosk" target="_blank" rel="noopener">Open the tablet screen</a>
          </fieldset>

          <fieldset><legend>Email to guests</legend>
            <p className="small muted">
              Confirmations and payment notices are sent from this address through Resend. Leave it empty and the
              system falls back to the address in the RESEND settings on Vercel.
            </p>
            <label className="field"><span>Sender address</span>
              <input type="text" name="mail_from" defaultValue={s.mail_from}
                placeholder="Kanton Hotel &lt;bookings@yourdomain.cm&gt;" /></label>
          </fieldset>

          <div className="panel pad">
            <h3>Printed on receipts</h3>
            <label className="field"><span>Business name</span>
              <input type="text" name="owner_name" defaultValue={s.owner_name} /></label>
            <label className="field"><span>Contact</span>
              <input type="text" name="owner_phone" defaultValue={s.owner_phone} /></label>
          </div>
        </div>
      </div>

      <button className="btn" style={{ marginTop: 8 }}>Save settings</button>
    </form>
  );
}
