import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/chrome";
import { ResBadge } from "@/components/bits";
import CopyButton from "@/components/CopyButton";
import { getReservationByCode, getSettings, roomIsTaken } from "@/lib/db";
import { reportPayment } from "@/app/actions/booking";
import { dialHref, dialString, fcfa, isHoldExpired, normPhone, prettyDate, stamp } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const r = await getReservationByCode(code);
  if (!r) notFound();
  const s = await getSettings();

  const due = Math.max(0, r.advance_due - r.paid);
  const dial = dialString(s, due || r.advance_due);
  const settled = r.paid >= r.advance_due && r.paid > 0;
  const lost = r.status === "held" && r.room_id
    ? await roomIsTaken(r.room_id, r.check_in, r.check_out, r.code) : false;
  const wa = normPhone(s.whatsapp)
    ? `https://wa.me/237${normPhone(s.whatsapp)}?text=` +
      encodeURIComponent(`Kanton Hotel — booking ${r.code}. Name: ${r.guest_name}. Room ${r.room_label}. Advance: ${r.advance_due} FCFA. Screenshot attached.`)
    : null;

  return (
    <>
      <SiteHeader />
      <main className="wrap section narrow">
        <div className="panel pad">
          <div className="spread">
            <div><span className="small muted">Booking code</span><div className="code">{r.code}</div></div>
            <ResBadge r={r} />
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>
            {r.guest_name} · room {r.room_label} · {prettyDate(r.check_in)} → {prettyDate(r.check_out)} ({r.nights} night{r.nights > 1 ? "s" : ""})
          </p>
        </div>

        {settled ? (
          <>
            <div className="notice ok" style={{ marginTop: 18 }}>
              <b>Advance received.</b> Your room is locked to your name. The balance of {fcfa(r.total - r.paid)} is
              paid at the desk on arrival.
            </div>
            <p style={{ marginTop: 16 }}><Link className="btn ghost" href="/find">See my booking</Link></p>
          </>
        ) : (
          <>
            <div className="panel pad" style={{ marginTop: 18 }}>
              <h2>Pay {fcfa(due)} now</h2>
              <p className="small muted">
                Mobile Money to {s.momo_name} · {s.momo_number}. Tap the button and your dialler opens with the code
                already written.
              </p>
              <div className="dial" style={{ margin: "14px 0" }}>{dial}</div>
              <div className="row">
                <a className="btn block" style={{ flex: 1, minWidth: 200 }} href={dialHref(s, due || r.advance_due)}>
                  Open my dialler and pay
                </a>
                <CopyButton text={dial} />
              </div>
              <p className="tiny muted" style={{ marginTop: 10 }}>
                If your phone does not open the dialler, copy the code and dial it by hand, then confirm with your PIN.
              </p>
            </div>

            <div className="panel pad" style={{ marginTop: 16 }}>
              <h3>Then send the screenshot</h3>
              <p className="small muted">
                Not compulsory, but it is the fastest proof at the desk. Add your transaction ID here too.
              </p>
              <form action={reportPayment}>
                <input type="hidden" name="code" value={r.code} />
                <label className="field"><span>Mobile Money transaction ID</span>
                  <input type="text" name="momoRef" defaultValue={r.momo_ref} placeholder="e.g. MP2609.1432.B12345" /></label>
                <div className="row">
                  <button className="btn teal">I have paid — tell reception</button>
                  {wa && <a className="btn ghost" href={wa} target="_blank" rel="noopener">Send screenshot on WhatsApp</a>}
                </div>
              </form>
              {r.payment_status === "reported" && (
                <div className="notice" style={{ marginTop: 12 }}>
                  You reported a payment{r.momo_ref ? ` (${r.momo_ref})` : ""}. Reception will confirm it. Keep your
                  screenshot until they do.
                </div>
              )}
            </div>

            {lost && (
              <div className="notice bad" style={{ marginTop: 16 }}>
                <b>Room {r.room_label} has just been paid for by another guest.</b> Call {s.phone} — reception will put
                you in the nearest room of the same class, or return your money.
              </div>
            )}
            <div className={"notice " + (isHoldExpired(r) ? "bad" : "")} style={{ marginTop: 16 }}>
              {isHoldExpired(r)
                ? <><b>This hold has run out.</b> The room is back on the board. Pay now and reception will restore it if it is still free.</>
                : <><b>Your room is held until {stamp(r.hold_until)}.</b> Until the advance lands, a guest paying at the desk can take it.</>}
            </div>
          </>
        )}

        <div className="summary" style={{ marginTop: 18 }}>
          <div className="sumline"><span>Room {r.room_label} · {r.nights} night{r.nights > 1 ? "s" : ""}</span><span>{fcfa(r.room_total)}</span></div>
          {r.food.map((f) => (
            <div className="sumline small" key={f.id}><span>{f.name} × {f.qty}</span><span>{fcfa(f.price * f.qty)}</span></div>
          ))}
          <div className="sumline total"><span>Total</span><span>{fcfa(r.total)}</span></div>
          <div className="sumline due"><span>Advance ({r.advance_percent}%)</span><span>{fcfa(r.advance_due)}</span></div>
          <div className="sumline small"><span className="muted">Already received</span><span>{fcfa(r.paid)}</span></div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
