import Link from "next/link";
import { ResTable } from "./ResTable";
import { requireStaff } from "@/lib/auth";
import { getReservations } from "@/lib/db";
import { todayISO } from "@/lib/util";

export const dynamic = "force-dynamic";

const TABS = [["active", "Live"], ["today", "Today"], ["held", "Awaiting advance"], ["reported", "Says paid"],
  ["confirmed", "Confirmed"], ["in", "In house"], ["history", "Finished"], ["all", "Everything"]] as const;

export default async function Reservations({
  searchParams,
}: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const staff = await requireStaff("reservations");
  const { tab = "active", q = "" } = await searchParams;
  const today = todayISO();
  let list = await getReservations();

  if (tab === "active") list = list.filter((r) => ["held", "confirmed", "checked_in"].includes(r.status));
  if (tab === "today") list = list.filter((r) => r.check_in === today || r.check_out === today);
  if (tab === "held") list = list.filter((r) => r.status === "held");
  if (tab === "reported") list = list.filter((r) => r.payment_status === "reported" && r.paid < r.advance_due);
  if (tab === "confirmed") list = list.filter((r) => r.status === "confirmed");
  if (tab === "in") list = list.filter((r) => r.status === "checked_in");
  if (tab === "history") list = list.filter((r) => ["checked_out", "cancelled", "no_show"].includes(r.status));

  const needle = q.trim().toLowerCase();
  if (needle)
    list = list.filter((r) =>
      `${r.code} ${r.guest_name} ${r.guest_phone} ${r.room_label}`.toLowerCase().includes(needle));

  // which unpaid holds sit on a room that somebody else has since paid for
  const paidRanges = list.filter((r) => ["confirmed", "checked_in"].includes(r.status));
  const lost = new Set(
    list.filter((r) => r.status === "held" && paidRanges.some((p) =>
      p.room_id === r.room_id && p.code !== r.code && p.check_in < r.check_out && p.check_out > r.check_in
    )).map((r) => r.code)
  );

  return (
    <>
      <div className="spread">
        <h2>Bookings</h2>
        <Link className="btn" href="/desk/new">New booking at the desk</Link>
      </div>
      <div className="pill-tabs" style={{ marginTop: 16 }}>
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/desk/reservations?tab=${k}`} className="plain">
            <button className={tab === k ? "on" : ""}>{l}</button>
          </Link>
        ))}
      </div>
      <form method="get" style={{ maxWidth: 340 }}>
        <input type="hidden" name="tab" value={tab} />
        <label className="field"><span>Search by code, name, phone or room</span>
          <input type="text" name="q" defaultValue={q} placeholder="KTN-… or a name" /></label>
      </form>
      <ResTable list={list} role={staff.role} lost={lost} empty="Nothing matches that filter." />
    </>
  );
}
