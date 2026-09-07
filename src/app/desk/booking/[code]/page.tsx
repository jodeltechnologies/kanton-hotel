import Link from "next/link";
import { notFound } from "next/navigation";
import { ResBadge } from "@/components/bits";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/roles";
import { availableRooms, getReservationByCode, roomIsTaken } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cancelBooking, checkIn, checkOut, markNoShow, moveRoom, takePayment } from "@/app/actions/desk";
import { fcfa, ID_TYPES, money, prettyDate, shortDate, SOURCE_LABEL, stamp, titleCase } from "@/lib/util";
import type { Payment } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BookingDetail({
  params, searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ needid?: string }>;
}) {
  const { code } = await params;
  const { needid } = await searchParams;
  const staff = await requireStaff("reservations");
  const r = await getReservationByCode(code);
  if (!r) notFound();

  const { data } = await supabaseAdmin().from("payments").select("*")
    .eq("reservation_id", r.id).order("created_at");
  const payments = (data ?? []) as Payment[];
  const due = Math.max(0, r.advance_due - r.paid);
  const balance = Math.max(0, r.total - r.paid);
  const lost = r.status === "held" && r.room_id
    ? await roomIsTaken(r.room_id, r.check_in, r.check_out, r.code) : false;
  const moveOptions = ["held", "confirmed", "checked_in"].includes(r.status)
    ? (await availableRooms(r.check_in, r.check_out)).filter((x) => x.id !== r.room_id) : [];

  return (
    <>
      <p className="small"><Link href="/desk/reservations">Bookings</Link> <span className="muted">/ {r.code}</span></p>
      <div className="spread">
        <div><span className="small muted">Booking</span><div className="code">{r.code}</div></div>
        <ResBadge r={r} />
      </div>

      {lost && (
        <div className="notice bad" style={{ marginTop: 14 }}>
          <b>Room {r.room_label} has been paid for by another guest for these dates.</b> Move this booking to a free
          room or call the guest.
        </div>
      )}

      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="summary">
          <div className="sumline"><span className="muted">Guest</span><b>{r.guest_name}</b></div>
          <div className="sumline"><span className="muted">Phone</span><b>{r.guest_phone}</b></div>
          {r.guest_email && <div className="sumline"><span className="muted">Email</span><b>{r.guest_email}</b></div>}
          <div className="sumline"><span className="muted">Room</span><b>{r.room_label} · {r.room_name}</b></div>
          <div className="sumline"><span className="muted">Stay</span>
            <b>{prettyDate(r.check_in)} → {shortDate(r.check_out)} ({r.nights}n)</b></div>
          <div className="sumline"><span className="muted">Guests</span><b>{r.guests}</b></div>
          <div className="sumline"><span className="muted">Arrival</span><b>{titleCase(r.arrival)}</b></div>
          <div className="sumline"><span className="muted">Booked</span><b>{SOURCE_LABEL[r.source] ?? r.source}</b></div>
          {r.id_card_number && (
            <div className="sumline"><span className="muted">ID recorded</span>
              <b>{r.id_card_type || "ID"} · {r.id_card_number}</b></div>
          )}
          {r.checked_in_at && (
            <div className="sumline"><span className="muted">Checked in</span>
              <b>{stamp(r.checked_in_at)} by {r.checked_in_by}</b></div>
          )}
          {r.note && <div className="sumline"><span className="muted">Note</span><b>{r.note}</b></div>}
        </div>
        <div className="summary">
          <div className="sumline"><span>Room {r.nights} × {money(r.room_price)}</span><span>{fcfa(r.room_total)}</span></div>
          {r.food.map((f) => (
            <div className="sumline small" key={f.id}><span>{f.name} × {f.qty}</span><span>{fcfa(f.price * f.qty)}</span></div>
          ))}
          <div className="sumline total"><span>Total</span><span>{fcfa(r.total)}</span></div>
          <div className="sumline"><span className="muted">Advance ({r.advance_percent}%)</span><b>{fcfa(r.advance_due)}</b></div>
          <div className="sumline"><span className="muted">Received</span><b>{fcfa(r.paid)}</b></div>
          <div className="sumline due">
            <span>{due > 0 ? "Advance outstanding" : "Balance on departure"}</span>
            <span>{fcfa(due > 0 ? due : balance)}</span>
          </div>
        </div>
      </div>

      {can(staff.role, "payments") && balance > 0 && r.status !== "cancelled" && (
        <div className="panel pad" id="payment" style={{ marginTop: 20 }}>
          <h3>Take payment</h3>
          <p className="small muted">
            Advance due {fcfa(due)} · full balance {fcfa(balance)}. A receipt number is created automatically.
          </p>
          <form action={takePayment}>
            <input type="hidden" name="code" value={r.code} />
            <div className="grid g2" style={{ gap: "0 14px" }}>
              <label className="field"><span>Amount received (FCFA)</span>
                <input type="number" name="amount" min={1} defaultValue={due || balance} required /></label>
              <label className="field"><span>How they paid</span>
                <select name="method" defaultValue="Mobile Money">
                  <option>Mobile Money</option><option>Cash</option><option>Bank transfer</option><option>Card</option>
                </select></label>
            </div>
            <label className="field"><span>Transaction ID / reference</span>
              <input type="text" name="reference" defaultValue={r.momo_ref}
                placeholder="MP2609.1432.B12345 or 'cash at desk'" /></label>
            <button className="btn">Record payment and print the receipt</button>
          </form>
        </div>
      )}

      <h3 style={{ margin: "24px 0 8px" }}>Payments</h3>
      {payments.length ? (
        <div className="tablewrap">
          <table>
            <thead><tr><th>When</th><th>Method</th><th>Reference</th><th>Taken by</th>
              <th className="right">Amount</th><th /></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{stamp(p.created_at)}</td><td>{p.method}</td><td>{p.reference || "—"}</td>
                  <td>{p.taken_by_name}</td><td className="right"><b>{money(p.amount)}</b></td>
                  <td><Link className="btn sm ghost" href={`/receipt/${r.code}?r=${p.receipt_no}`}>Receipt</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="panel pad muted small">No payment recorded yet.</div>}

      {can(staff.role, "checkin") && ["held", "confirmed"].includes(r.status) && (
        <div className="panel pad" style={{ marginTop: 20, maxWidth: 620 }}>
          <h3>Check in</h3>
          <p className="small muted">
            Take the guest&apos;s ID card and type the number exactly as printed. It stays on the file and on the police register.
          </p>
          {needid && <div className="notice bad" style={{ marginBottom: 12 }}>The ID card number is required to check a guest in.</div>}
          {balance > 0 && (
            <div className="notice" style={{ marginBottom: 12 }}>
              {fcfa(balance)} is still owed. Collect it first unless the manager says otherwise.
            </div>
          )}
          <form action={checkIn}>
            <input type="hidden" name="code" value={r.code} />
            <div className="grid g2" style={{ gap: "0 14px" }}>
              <label className="field"><span>Type of ID</span>
                <select name="idType" defaultValue={r.id_card_type || ID_TYPES[0]}>
                  {ID_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select></label>
              <label className="field"><span>ID card number</span>
                <input type="text" name="idNumber" defaultValue={r.id_card_number}
                  placeholder="e.g. 1234567890" required style={{ textTransform: "uppercase" }} /></label>
            </div>
            <button className="btn teal">Check in and hand over the key</button>
          </form>
        </div>
      )}

      <div className="row" style={{ marginTop: 20 }}>
        {can(staff.role, "checkin") && r.status === "checked_in" && (
          <form action={checkOut}><input type="hidden" name="code" value={r.code} />
            <button className="btn teal">Check out</button></form>
        )}
        {can(staff.role, "noshow") && ["held", "confirmed"].includes(r.status) && (
          <form action={markNoShow}><input type="hidden" name="code" value={r.code} />
            <button className="btn danger">Mark no-show</button></form>
        )}
        {can(staff.role, "cancel") && ["held", "confirmed"].includes(r.status) && (
          <form action={cancelBooking}><input type="hidden" name="code" value={r.code} />
            <button className="btn danger">Cancel</button></form>
        )}
        {r.paid > 0 && <Link className="btn ghost" href={`/receipt/${r.code}?invoice=1`}>Print invoice</Link>}
      </div>

      {moveOptions.length > 0 && (
        <div className="panel pad" style={{ marginTop: 20, maxWidth: 480 }}>
          <h3>Move to another room</h3>
          <p className="small muted">Only rooms free for {shortDate(r.check_in)} → {shortDate(r.check_out)} are listed. The price follows the new room.</p>
          <form action={moveRoom}>
            <input type="hidden" name="code" value={r.code} />
            <label className="field"><span>New room</span>
              <select name="roomId" required>
                <option value="">Choose…</option>
                {moveOptions.map((x) => (
                  <option key={x.id} value={x.id}>{x.number} · {x.name} — {money(x.price)}/night</option>
                ))}
              </select></label>
            <button className="btn ghost">Move the booking</button>
          </form>
        </div>
      )}

      {r.history?.length > 0 && (
        <details style={{ marginTop: 18 }}>
          <summary className="small muted">File history</summary>
          <ul className="small muted">
            {r.history.map((h, i) => <li key={i}>{stamp(h.at)} — {h.what} <span className="tiny">({h.by})</span></li>)}
          </ul>
        </details>
      )}
    </>
  );
}
