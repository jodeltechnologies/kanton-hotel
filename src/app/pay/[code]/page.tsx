import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/chrome";
import { ResBadge } from "@/components/bits";
import GuestPayment from "@/components/GuestPayment";
import { getReservationByCode, getSettings, roomIsTaken } from "@/lib/db";
import { paymentMode, preferredPaymentMode } from "@/lib/payment";
import { fcfa, isHoldExpired, prettyDate, stamp } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function PayPage({ params, searchParams }: {
  params: Promise<{ code: string }>; searchParams: Promise<{ mode?: string }>;
}) {
  const { code } = await params;
  const { mode } = await searchParams;
  const r = await getReservationByCode(code);
  if (!r) notFound();
  const s = await getSettings();
  const secured = r.paid >= r.advance_due && r.paid > 0;
  const lost = r.status === "held" && r.room_id ? await roomIsTaken(r.room_id, r.check_in, r.check_out, r.code) : false;
  const closed = ["cancelled", "no_show", "checked_out"].includes(r.status);
  return <>
    <SiteHeader />
    <main className="wrap section narrow">
      <div className="panel pad">
        <div className="spread">
          <div><span className="small muted">Booking code</span><div className="code">{r.code}</div></div>
          <ResBadge r={r} />
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>{r.guest_name} · room {r.room_label} · {prettyDate(r.check_in)} to {prettyDate(r.check_out)} ({r.nights} night{r.nights > 1 ? "s" : ""})</p>
      </div>
      {secured && !closed && <div className="notice ok" style={{ marginTop: 18 }}>
        <b>{r.paid >= r.total ? "Paid in full." : "Advance received."}</b>{" "}
        {r.paid >= r.total ? "Your stay has no remaining balance." : `Your room is secured. You can pay the remaining ${fcfa(r.total - r.paid)} now or on arrival.`}
      </div>}
      {lost && <div className="notice bad" style={{ marginTop: 18 }}>
        Room {r.room_label} has been taken for these dates. Call {s.phone} before paying so reception can arrange another room.
      </div>}
      <GuestPayment bill={{ code: r.code, total: r.total, paid: r.paid, advance_due: r.advance_due,
        advance_percent: r.advance_percent, payment_status: r.payment_status, momo_ref: r.momo_ref,
        guest_name: r.guest_name, guest_phone: r.guest_phone }}
        settings={{ momo_name: s.momo_name, momo_number: s.momo_number, momo_pattern: s.momo_pattern, whatsapp: s.whatsapp }}
        initialMode={mode ? paymentMode(mode) : preferredPaymentMode(r)} disabled={lost || closed} />
      {!secured && !closed && !lost && <div className={"notice " + (isHoldExpired(r) ? "bad" : "")} style={{ marginTop: 16 }}>
        {isHoldExpired(r) ? <>Your booking window has expired. Contact reception to check availability before paying.</>
          : <>Pay before {stamp(r.hold_until)}. The room is secured when reception confirms your advance or full payment.</>}
      </div>}
      <div className="summary" style={{ marginTop: 18 }}>
        <div className="sumline"><span>Room {r.room_label} · {r.nights} nights</span><span>{fcfa(r.room_total)}</span></div>
        {r.food.map((f) => <div className="sumline small" key={f.id}><span>{f.name} × {f.qty}</span><span>{fcfa(f.price * f.qty)}</span></div>)}
        <div className="sumline total"><span>Total stay</span><span>{fcfa(r.total)}</span></div>
        <div className="sumline"><span>Confirmed payments</span><span>{fcfa(r.paid)}</span></div>
        <div className="sumline due"><span>Balance due</span><span>{fcfa(Math.max(0, r.total - r.paid))}</span></div>
      </div>
      <p style={{ marginTop: 16 }}><Link href="/find">Find my booking</Link></p>
    </main>
    <SiteFooter />
  </>;
}
