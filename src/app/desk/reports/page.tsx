import { requireStaff } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getReservations } from "@/lib/db";
import { fcfa, money, stamp, todayISO } from "@/lib/util";
import type { Payment } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Reports() {
  await requireStaff("reports");
  const today = todayISO();
  const month = today.slice(0, 7);

  const { data } = await supabaseAdmin()
    .from("payments").select("*, reservations(code, guest_name)")
    .order("created_at", { ascending: false }).limit(200);
  const pays = (data ?? []) as (Payment & { reservations: { code: string; guest_name: string } | null })[];
  const all = await getReservations();

  const sum = (a: typeof pays) => a.reduce((x, p) => x + p.amount, 0);
  const todayPays = pays.filter((p) => p.created_at.slice(0, 10) === today);
  const monthPays = pays.filter((p) => p.created_at.slice(0, 7) === month);
  const byMethod: Record<string, number> = {};
  monthPays.forEach((p) => { byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount; });

  const nights = all.filter((r) => ["checked_in", "checked_out", "confirmed"].includes(r.status))
    .reduce((a, r) => a + r.nights, 0);
  const outstanding = all.filter((r) => ["confirmed", "checked_in"].includes(r.status))
    .reduce((a, r) => a + Math.max(0, r.total - r.paid), 0);

  return (
    <>
      <h2>Takings</h2>
      <div className="grid g4" style={{ margin: "18px 0 24px" }}>
        <div className="stat money"><b>{money(sum(todayPays))}</b><span>FCFA today</span></div>
        <div className="stat money"><b>{money(sum(monthPays))}</b><span>FCFA this month</span></div>
        <div className="stat"><b>{nights}</b><span>room-nights sold</span></div>
        <div className="stat bad"><b>{money(outstanding)}</b><span>FCFA owed by guests in house</span></div>
      </div>

      <div className="grid g2">
        <div className="panel pad">
          <h3>This month by method</h3>
          {Object.keys(byMethod).length
            ? Object.entries(byMethod).map(([m, v]) => (
                <div className="sumline" key={m}><span>{m}</span><b>{fcfa(v)}</b></div>))
            : <p className="small muted">No payments yet.</p>}
          <div className="sumline total"><span>Total</span><span>{fcfa(sum(monthPays))}</span></div>
        </div>
        <div className="panel pad">
          <h3>Losses</h3>
          <div className="sumline"><span>No-shows recorded</span><b>{all.filter((r) => r.status === "no_show").length}</b></div>
          <div className="sumline"><span>Cancelled bookings</span><b>{all.filter((r) => r.status === "cancelled").length}</b></div>
          <div className="sumline"><span>Bookings awaiting an advance</span><b>{all.filter((r) => r.status === "held").length}</b></div>
        </div>
      </div>

      <h3 style={{ margin: "26px 0 10px" }}>Payment log</h3>
      {pays.length ? (
        <div className="tablewrap">
          <table>
            <thead><tr><th>When</th><th>Booking</th><th>Guest</th><th>Method</th>
              <th>Reference</th><th>Taken by</th><th className="right">Amount</th></tr></thead>
            <tbody>
              {pays.map((p) => (
                <tr key={p.id}>
                  <td>{stamp(p.created_at)}</td>
                  <td><b>{p.reservations?.code ?? "—"}</b></td>
                  <td>{p.reservations?.guest_name ?? "—"}</td>
                  <td>{p.method}</td><td>{p.reference || "—"}</td><td>{p.taken_by_name}</td>
                  <td className="right"><b>{money(p.amount)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="panel pad muted small">No payments recorded yet.</div>}
    </>
  );
}
