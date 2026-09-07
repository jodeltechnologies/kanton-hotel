import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/chrome";
import { getSettings } from "@/lib/db";

export default async function Policy() {
  const s = await getSettings();
  return (
    <>
      <SiteHeader />
      <main className="wrap section narrow">
        <div className="section-head"><h2>Booking rules</h2><p>Short, and we apply them.</p></div>
        <div className="panel pad stack">
          <div><h3>The advance holds the room, nothing else does</h3>
            <p className="small">{s.advance_percent}% of the total, by Mobile Money, within {s.hold_hours} hours
              of booking. Until it arrives your name is on the list but the room is still on sale — if a guest walks in
              and pays for it first, it is theirs and we will offer you the nearest equivalent.</p></div>
          <div><h3>Book and don&apos;t come</h3>
            <p className="small">If you do not arrive within {s.arrival_grace_hours} hours of your arrival date and we
              have not heard from you, the booking is marked a no-show: the advance is not refunded and the room goes
              back on sale. {s.strike_limit} no-shows on the same phone number and that number can no longer book
              online — only at the desk, paid in full.</p></div>
          <div><h3>Coming late, or fewer nights</h3>
            <p className="small">Call reception on {s.phone} before your arrival date and we will move the dates once,
              free. Nights you booked and did not use are still charged — the room was closed for them.</p></div>
          <div><h3>Cancelling</h3>
            <p className="small">Cancel more than {s.cancel_window_hours} hours before your arrival date and the
              advance stays as credit for a later stay. Inside that window it is kept.</p></div>
          <div><h3>Meals</h3>
            <p className="small">Meals ordered in advance are cooked for your arrival slot. Tea or coffee breakfast is
              included with every room, so it never appears on your bill.</p></div>
          <div><h3>The house</h3>
            <p className="small">Checkout {s.checkout_time}. Free unlimited internet and a smart TV in every room.
              ID is checked at the desk.</p></div>
        </div>
        <p style={{ marginTop: 18 }}><Link className="btn" href="/rooms">Choose a room</Link></p>
      </main>
      <SiteFooter />
    </>
  );
}
