import { SiteHeader, SiteFooter } from "@/components/chrome";
import { RoomCard } from "@/components/bits";
import { getRooms } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { todayISO, addDays } from "@/lib/util";
import Link from "next/link";

export const revalidate = 15;

const CATS = [["all", "All rooms"], ["standard", "Standard"], ["modern", "Modern standard"],
  ["vip", "V.I.P"], ["executive", "Executive V.I.P"]] as const;

export default async function RoomsPage({
  searchParams,
}: { searchParams: Promise<{ cat?: string }> }) {
  const { cat = "all" } = await searchParams;
  const rooms = await getRooms(true);
  const today = todayISO();
  const { data: busyRows } = await supabaseAdmin().from("reservations").select("room_id")
    .in("status", ["confirmed", "checked_in"])
    .lt("check_in", addDays(today, 1)).gt("check_out", today);
  const busy = new Set((busyRows ?? []).map((b) => b.room_id));

  const list = rooms
    .filter((r) => cat === "all" || r.category === cat)
    .sort((a, b) => a.price - b.price || a.number.localeCompare(b.number));

  return (
    <>
      <SiteHeader />
      <main className="wrap section">
        <div className="section-head">
          <h2>Rooms &amp; prices</h2>
          <p>Every room has free unlimited internet, a smart TV, air conditioning and a private bathroom.</p>
        </div>
        <div className="pill-tabs">
          {CATS.map(([k, l]) => (
            <Link key={k} href={`/rooms?cat=${k}`} className="plain">
              <button className={cat === k ? "on" : ""}>{l}</button>
            </Link>
          ))}
        </div>
        <div className="grid g3">
          {list.length
            ? list.map((r) => <RoomCard key={r.id} room={r} taken={busy.has(r.id)} />)
            : <p className="muted">No rooms in this category yet.</p>}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
