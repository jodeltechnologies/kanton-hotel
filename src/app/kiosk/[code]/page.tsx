import Link from "next/link";
import { notFound } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import { getReservationByCode, getSettings } from "@/lib/db";
import { dialHref, dialString, fcfa, prettyDate } from "@/lib/util";

export const dynamic = "force-dynamic";

/** The "take this to the desk" screen on the reception tablet. */
export default async function KioskDone({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const r = await getReservationByCode(code);
  if (!r) notFound();
  const s = await getSettings();
  const dial = dialString(s, r.advance_due);

  return (
    <main className="kiosk">
      <div className="kiosk-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/logo.png" alt={s.hotel_name} />
      </div>
      <div className="kiosk-center">
        <div className="panel pad" style={{ maxWidth: 620, width: "100%", textAlign: "center" }}>
          <p className="small muted" style={{ marginBottom: 4 }}>Room {r.room_label} is reserved for you</p>
          <div className="code" style={{ fontSize: "2.6rem" }}>{r.code}</div>
          <p style={{ marginTop: 10 }}>
            {r.guest_name} · {prettyDate(r.check_in)} → {prettyDate(r.check_out)} ({r.nights} night{r.nights > 1 ? "s" : ""})
          </p>

          <div className="notice" style={{ textAlign: "left", marginTop: 16 }}>
            <b>Give this code to the receptionist to pay {fcfa(r.advance_due)}</b> — cash or Mobile Money at the desk.
            The room is not held until the advance is in.
          </div>

          <div className="dial" style={{ margin: "16px 0" }}>{dial}</div>
          <div className="row" style={{ justifyContent: "center" }}>
            <a className="btn" href={dialHref(s, r.advance_due)}>Pay from my own phone</a>
            <CopyButton text={dial} label="Copy the code" />
          </div>

          <p className="tiny muted" style={{ marginTop: 16 }}>
            {r.guest_email ? "A confirmation has been sent to your email. " : ""}
            Checkout is {s.checkout_time}.
          </p>

          <hr />
          <Link className="btn ghost block" href="/kiosk">Done — start a new booking</Link>
        </div>
      </div>
    </main>
  );
}
