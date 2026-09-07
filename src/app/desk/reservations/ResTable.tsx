import Link from "next/link";
import { ResBadge } from "@/components/bits";
import { can } from "@/lib/roles";
import { isHoldExpired, money, shortDate, stamp } from "@/lib/util";
import type { Reservation, Role } from "@/lib/types";

export function ResTable({
  list, role, empty, lost = new Set<string>(),
}: { list: Reservation[]; role: Role; empty: string; lost?: Set<string> }) {
  if (!list.length) return <div className="panel pad muted small">{empty}</div>;
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Code</th><th>Guest</th><th>Room</th><th>Dates</th>
            <th className="right">Total</th><th className="right">Paid</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => {
            const due = Math.max(0, r.advance_due - r.paid);
            return (
              <tr key={r.code}>
                <td>
                  <b>{r.code}</b>
                  <div className="tiny muted">{r.source === "walk-in" ? "at the desk" : "online"} · {stamp(r.created_at)}</div>
                </td>
                <td>{r.guest_name}<div className="tiny muted">{r.guest_phone}</div></td>
                <td>{r.room_label}</td>
                <td>{shortDate(r.check_in)} → {shortDate(r.check_out)}
                  <div className="tiny muted">{r.nights} night{r.nights > 1 ? "s" : ""}</div></td>
                <td className="right">{money(r.total)}</td>
                <td className="right">{money(r.paid)}
                  {due > 0 && <div className="tiny" style={{ color: "var(--caramel)" }}>{money(due)} due</div>}</td>
                <td>
                  <ResBadge r={r} />
                  {r.payment_status === "reported" && due > 0 && (
                    <div className="tiny" style={{ color: "var(--warn)" }}>says paid{r.momo_ref ? " · " + r.momo_ref : ""}</div>
                  )}
                  {isHoldExpired(r) && <div className="tiny" style={{ color: "var(--bad)" }}>hold expired</div>}
                  {lost.has(r.code) && <div className="tiny" style={{ color: "var(--bad)" }}>room sold to someone else — move them</div>}
                </td>
                <td className="acts">
                  <Link className="btn sm ghost" href={`/desk/booking/${r.code}`}>Open</Link>
                  {can(role, "payments") && due > 0 && ["held", "confirmed", "checked_in"].includes(r.status) && (
                    <Link className="btn sm" href={`/desk/booking/${r.code}#payment`}>Take payment</Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
