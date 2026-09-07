import BookingForm from "@/app/book/BookingForm";
import { requireStaff } from "@/lib/auth";
import { getMenu, getRooms, getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DeskNew() {
  await requireStaff("reservations");
  const [rooms, menu, s] = await Promise.all([getRooms(true), getMenu(true), getSettings()]);
  return (
    <>
      <h2>New booking at the desk</h2>
      <p className="small muted">Same file as an online booking. The payment screen opens straight after.</p>
      <div style={{ marginTop: 16 }}>
        <BookingForm rooms={rooms} menu={menu} advancePercent={s.advance_percent} atDesk />
      </div>
    </>
  );
}
