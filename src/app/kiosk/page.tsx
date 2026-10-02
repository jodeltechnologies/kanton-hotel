import { cookies } from "next/headers";
import Link from "next/link";
import KioskGate from "./KioskGate";
import KioskPicker from "./KioskPicker";
import { availableRooms, getSettings } from "@/lib/db";
import { addDays, nightsBetween, todayISO } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function KioskPage({ searchParams }: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; tablet?: string }>;
}) {
  const query = await searchParams;
  const settings = await getSettings();
  // Public guests can use the homepage kiosk. The dedicated staff tablet keeps its PIN gate.
  const tablet = query.tablet === "1";
  const unlocked = (await cookies()).get("kanton_kiosk")?.value === "1";
  if (tablet && !unlocked) {
    return <main className="kiosk">
      <div className="kiosk-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/logo.png" alt={settings.hotel_name} />
        <Link href="/">Home</Link>
      </div>
      <KioskGate />
    </main>;
  }

  const today = todayISO();
  const validDate = (value?: string) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
  const checkIn = validDate(query.checkIn) && query.checkIn! >= today ? query.checkIn! : today;
  const checkOut = validDate(query.checkOut) && nightsBetween(checkIn, query.checkOut!) > 0 ? query.checkOut! : addDays(checkIn, 1);
  const rooms = (await availableRooms(checkIn, checkOut)).filter((r) =>
    checkIn === today ? r.status === "available" : r.status !== "maintenance" && r.status !== "cleaning");

  return (
    <main className="kiosk">
      <div className="kiosk-brand">
        <Link href="/" aria-label="Hotel homepage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="/logo.png" alt={settings.hotel_name} />
        </Link>
        <div className="row"><Link href="/">Home</Link><Link href="/find">My booking</Link><Link href="/desk">Staff</Link></div>
      </div>
      <form action="/kiosk" className="panel pad kiosk-wide kiosk-dates">
        {tablet && <input type="hidden" name="tablet" value="1" />}
        <label className="field"><span>Arriving</span><input name="checkIn" type="date" defaultValue={checkIn} min={today} required /></label>
        <label className="field"><span>Leaving</span><input name="checkOut" type="date" defaultValue={checkOut} min={addDays(checkIn, 1)} required /></label>
        <button className="btn">Show available rooms</button>
      </form>
      <KioskPicker key={`${checkIn}-${checkOut}`} rooms={rooms}
        settings={{ checkout_time: settings.checkout_time, advance_percent: settings.advance_percent }}
        checkIn={checkIn} checkOut={checkOut} />
    </main>
  );
}
