import Link from "next/link";
import { ResTable } from "./reservations/ResTable";
import { getReservations, getRooms, getSettings } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isHoldExpired, money, prettyDate, todayISO } from "@/lib/util";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DeskToday({
  searchParams,
}: { searchParams: Promise<{ denied?: string }> }) {
  const staff = await requireStaff("desk");
  const { denied } = await searchParams;
  const today = todayISO();
  const [all, rooms] = await Promise.all([getReservations(), getRooms(true)]);
  await getSettings();

  const arrivals = all.filter((r) => r.check_in === today && ["held", "confirmed"].includes(r.status));
  const departures = all.filter((r) => r.check_out === today && r.status === "checked_in");
  const inHouse = all.filter((r) => r.status === "checked_in");
  const toConfirm = all.filter((r) => r.payment_status === "reported" && r.paid < r.advance_due);
  const expired = all.filter(isHoldExpired);
  const free = rooms.filter((r) => r.status === "available").length;

  const { data: pays } = await supabaseAdmin().from("payments").select("amount")
    .gte("created_at", today + "T00:00:00").lte("created_at", today + "T23:59:59");
  const takings = (pays ?? []).reduce((a, p) => a + p.amount, 0);

  return (
    <>
      {denied && <div className="notice bad" style={{ marginBottom: 16 }}>That page is not open to your role.</div>}
      <div className="spread">
        <h2>Today · {prettyDate(today)}</h2>
        <Link className="btn" href="/desk/new">New booking at the desk</Link>
      </div>

      <div className="grid g4" style={{ margin: "18px 0 24px" }}>
        <div className="stat"><b>{arrivals.length}</b><span>arriving today</span></div>
        <div className="stat"><b>{inHouse.length}</b><span>guests in house</span></div>
        <div className="stat"><b>{free}</b><span>rooms free</span></div>
        <div className="stat money"><b>{money(takings)}</b><span>FCFA taken today</span></div>
      </div>

      {toConfirm.length > 0 && (
        <div className="notice" style={{ marginBottom: 18 }}>
          <b>{toConfirm.length} guest{toConfirm.length > 1 ? "s say they have" : " says they have"} paid.</b>{" "}
          Check the Mobile Money account, then confirm on the Bookings page.
        </div>
      )}
      {expired.length > 0 && (
        <div className="notice bad" style={{ marginBottom: 18 }}>
          <b>{expired.length} hold{expired.length > 1 ? "s have" : " has"} run out</b> without an advance. Those rooms are free to sell.
        </div>
      )}

      <h3 style={{ marginBottom: 10 }}>Arriving today</h3>
      <ResTable list={arrivals} role={staff.role} empty="Nobody is expected today." />
      <h3 style={{ margin: "26px 0 10px" }}>Checking out today</h3>
      <ResTable list={departures} role={staff.role} empty="No departures on the board." />
      <h3 style={{ margin: "26px 0 10px" }}>In house</h3>
      <ResTable list={inHouse} role={staff.role} empty="The house is empty." />
    </>
  );
}
