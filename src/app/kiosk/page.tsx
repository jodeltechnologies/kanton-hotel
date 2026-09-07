import { cookies } from "next/headers";
import Link from "next/link";
import KioskGate from "./KioskGate";
import KioskPicker from "./KioskPicker";
import { availableRooms, getSettings } from "@/lib/db";
import { addDays, todayISO } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function KioskPage() {
  const store = await cookies();
  const unlocked = store.get("kanton_kiosk")?.value === "1";
  const settings = await getSettings();

  if (!unlocked) {
    return (
      <main className="kiosk">
        <div className="kiosk-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="/logo.png" alt={settings.hotel_name} />
        </div>
        <KioskGate />
      </main>
    );
  }

  const today = todayISO();
  const rooms = (await availableRooms(today, addDays(today, 1)))
    .filter((r) => r.status === "available");

  return (
    <main className="kiosk">
      <div className="kiosk-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/logo.png" alt={settings.hotel_name} />
        <Link href="/desk" className="tiny muted" style={{ marginLeft: "auto" }}>Staff</Link>
      </div>
      <KioskPicker rooms={rooms} settings={settings} />
    </main>
  );
}
