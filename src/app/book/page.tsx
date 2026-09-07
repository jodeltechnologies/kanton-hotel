import { SiteHeader, SiteFooter } from "@/components/chrome";
import BookingForm from "./BookingForm";
import { getMenu, getRooms, getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: { searchParams: Promise<{ room?: string }> }) {
  const { room } = await searchParams;
  const [rooms, menu, s] = await Promise.all([getRooms(true), getMenu(true), getSettings()]);
  return (
    <>
      <SiteHeader />
      <main className="wrap section">
        <div className="section-head">
          <h2>Your reservation</h2>
          <p>Nothing is charged here. You pay by Mobile Money on the next screen.</p>
        </div>
        <BookingForm
          rooms={[...rooms].sort((a, b) => a.price - b.price)}
          menu={menu}
          advancePercent={s.advance_percent}
          preselect={room}
        />
      </main>
      <SiteFooter />
    </>
  );
}
