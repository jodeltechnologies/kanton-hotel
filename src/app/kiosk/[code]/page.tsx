import Link from "next/link";
import { notFound } from "next/navigation";
import GuestPayment from "@/components/GuestPayment";
import { getReservationByCode, getSettings, roomIsTaken } from "@/lib/db";
import { paymentMode, preferredPaymentMode } from "@/lib/payment";
import { prettyDate } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function KioskDone({ params, searchParams }: {
  params: Promise<{ code: string }>; searchParams: Promise<{ mode?: string }>;
}) {
  const { code } = await params;
  const { mode } = await searchParams;
  const r = await getReservationByCode(code);
  if (!r) notFound();
  const s = await getSettings();
  const lost = r.status === "held" && r.room_id ? await roomIsTaken(r.room_id, r.check_in, r.check_out, r.code) : false;
  const closed = ["cancelled", "no_show", "checked_out"].includes(r.status);
  return <main className="kiosk">
    <div className="kiosk-brand">
      <Link href="/" aria-label="Hotel homepage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/logo.png" alt={s.hotel_name} />
      </Link>
      <Link href="/">Home</Link>
    </div>
    <div className="wrap narrow">
      <div className="panel pad">
        <h1 style={{ fontSize: "1.8rem" }}>Your booking</h1>
        <div className="code">{r.code}</div>
        <p>{r.guest_name} · room {r.room_label}<br />{prettyDate(r.check_in)} to {prettyDate(r.check_out)} ({r.nights} night{r.nights > 1 ? "s" : ""})</p>
        <p className="small muted">Keep this code. Reception uses it to find your booking and confirm your payment.</p>
      </div>
      {lost && <div className="notice bad" style={{ marginTop: 18 }}>This room is now taken for your dates. Contact reception before paying.</div>}
      <GuestPayment bill={{ code: r.code, total: r.total, paid: r.paid, advance_due: r.advance_due,
        advance_percent: r.advance_percent, payment_status: r.payment_status, momo_ref: r.momo_ref,
        guest_name: r.guest_name, guest_phone: r.guest_phone }}
        settings={{ momo_name: s.momo_name, momo_number: s.momo_number, momo_pattern: s.momo_pattern, whatsapp: s.whatsapp }}
        initialMode={mode ? paymentMode(mode) : preferredPaymentMode(r)} disabled={lost || closed} />
      <p style={{ marginTop: 18 }}><Link className="btn ghost block" href="/kiosk">Start a new booking</Link></p>
    </div>
  </main>;
}
