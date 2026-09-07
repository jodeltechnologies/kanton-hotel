import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/chrome";
import { ResBadge } from "@/components/bits";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSettings, getReservationByCode, roomIsTaken } from "@/lib/db";
import { guestCancel } from "@/app/actions/booking";
import { fcfa, isHoldExpired, normPhone, prettyDate, shortDate, stamp } from "@/lib/util";
import type { Reservation } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FindPage({
  searchParams,
}: { searchParams: Promise<{ code?: string; phone?: string; open?: string }> }) {
  const { code = "", phone = "", open = "" } = await searchParams;
  const s = await getSettings();

  let matches: Reservation[] = [];
  if (open) {
    const r = await getReservationByCode(open);
    if (r) matches = [r];
  } else if (code.trim()) {
    const r = await getReservationByCode(code);
    if (r) matches = [r];
  } else if (normPhone(phone).length >= 8) {
    const { data } = await supabaseAdmin().from("reservations").select("*")
      .ilike("guest_phone", `%${normPhone(phone)}%`).order("created_at", { ascending: false }).limit(10);
    matches = (data ?? []) as Reservation[];
  }
  const searched = !!(code.trim() || phone.trim() || open);
  const one = matches.length === 1 ? matches[0] : null;
  const lost = one && one.status === "held" && one.room_id
    ? await roomIsTaken(one.room_id, one.check_in, one.check_out, one.code) : false;
  const due = one ? Math.max(0, one.advance_due - one.paid) : 0;

  return (
    <>
      <SiteHeader />
      <main className="wrap section narrow">
        <div className="section-head"><h2>Find my booking</h2><p>Your code, or the phone number you booked with.</p></div>
        <form className="panel pad" method="get">
          <div className="grid g2" style={{ gap: "0 14px" }}>
            <label className="field"><span>Booking code</span>
              <input type="text" name="code" defaultValue={code} placeholder="KTN-AB1234" /></label>
            <label className="field"><span>or phone number</span>
              <input type="tel" name="phone" defaultValue={phone} placeholder="6XX XXX XXX" /></label>
          </div>
          <button className="btn">Find it</button>
        </form>

        {matches.length > 1 && (
          <div className="panel pad" style={{ marginTop: 14 }}>
            <h3>{matches.length} bookings on that number</h3>
            {matches.map((r) => (
              <div className="spread" key={r.code} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <div><b>{r.code}</b> <span className="small muted">room {r.room_label} · {shortDate(r.check_in)}</span></div>
                <Link className="btn sm ghost" href={`/find?open=${r.code}`}>Open</Link>
              </div>
            ))}
          </div>
        )}

        {one && (
          <div className="panel pad" style={{ marginTop: 18 }}>
            <div className="spread">
              <div><span className="small muted">Booking</span><div className="code">{one.code}</div></div>
              <ResBadge r={one} />
            </div>
            <hr />
            <div className="sumline"><span className="muted">Guest</span><b>{one.guest_name}</b></div>
            <div className="sumline"><span className="muted">Room</span><b>{one.room_label}</b></div>
            <div className="sumline"><span className="muted">Arriving</span><b>{prettyDate(one.check_in)}</b></div>
            <div className="sumline"><span className="muted">Leaving</span><b>{prettyDate(one.check_out)} · {s.checkout_time}</b></div>
            {one.food.length > 0 && (
              <div className="sumline"><span className="muted">Meals ordered</span>
                <b>{one.food.map((f) => `${f.name} ×${f.qty}`).join(", ")}</b></div>
            )}
            <div className="sumline total"><span>Total</span><span>{fcfa(one.total)}</span></div>
            <div className="sumline"><span className="muted">Received</span><b>{fcfa(one.paid)}</b></div>
            <div className="sumline due">
              <span>{due > 0 ? "Advance still to pay" : "Balance on arrival"}</span>
              <span>{fcfa(due > 0 ? due : one.total - one.paid)}</span>
            </div>
            {lost && (
              <div className="notice bad" style={{ marginTop: 12 }}>
                Somebody paid for room {one.room_label} before you. Call {s.phone} — we will move you to the nearest free room.
              </div>
            )}
            {isHoldExpired(one) && (
              <div className="notice" style={{ marginTop: 12 }}>
                Your hold ran out on {stamp(one.hold_until)}. The room is back on sale until the advance arrives.
              </div>
            )}
            <div className="row" style={{ marginTop: 14 }}>
              {due > 0 && ["held", "confirmed"].includes(one.status) && (
                <Link className="btn" href={`/pay/${one.code}`}>Pay the advance</Link>
              )}
              {one.paid > 0 && (
                <Link className="btn ghost" href={`/receipt/${one.code}?p=${normPhone(one.guest_phone)}`}>
                  Print my receipt
                </Link>
              )}
              {["held", "confirmed"].includes(one.status) && (
                <form action={guestCancel}>
                  <input type="hidden" name="code" value={one.code} />
                  <button className="btn danger">Cancel this booking</button>
                </form>
              )}
            </div>
          </div>
        )}

        {searched && !matches.length && (
          <div className="notice bad" style={{ marginTop: 14 }}>
            Nothing found. Check the code, or call {s.phone}.
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
