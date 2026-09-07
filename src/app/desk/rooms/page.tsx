import { RoomBadge } from "@/components/bits";
import { requireStaff } from "@/lib/auth";
import { getReservations, getRooms } from "@/lib/db";
import { setRoomStatus } from "@/app/actions/desk";
import { money, shortDate, todayISO } from "@/lib/util";

export const dynamic = "force-dynamic";

const NEXT_LABEL: Record<string, string> = { available: "Free", cleaning: "Cleaning", maintenance: "Repair" };

export default async function RoomBoard() {
  await requireStaff("rooms");
  const [rooms, all] = await Promise.all([getRooms(true), getReservations()]);
  const today = todayISO();

  return (
    <>
      <h2>Room board</h2>
      <p className="small muted">Housekeeping and reception share this board. Occupied is set by check-in.</p>
      <div className="grid g3" style={{ marginTop: 18 }}>
        {rooms.map((r) => {
          const guest = all.find((x) => x.room_id === r.id && x.status === "checked_in");
          const next = all
            .filter((x) => x.room_id === r.id && ["confirmed", "held"].includes(x.status) && x.check_in >= today)
            .sort((a, b) => a.check_in.localeCompare(b.check_in))[0];
          return (
            <div className="panel pad" key={r.id}>
              <div className="spread">
                <div>
                  <b className="slab" style={{ fontSize: "1.3rem" }}>{r.number}</b>
                  <div className="small muted">{r.name} · {money(r.price)}</div>
                </div>
                <RoomBadge status={r.status} />
              </div>
              {guest && (
                <div className="small" style={{ marginTop: 8 }}>
                  In house: <b>{guest.guest_name}</b> until {shortDate(guest.check_out)}
                </div>
              )}
              {next && (
                <div className="small muted" style={{ marginTop: 4 }}>
                  Next: {next.guest_name} on {shortDate(next.check_in)} ({next.status === "held" ? "unpaid" : "confirmed"})
                </div>
              )}
              <div className="row" style={{ marginTop: 10 }}>
                {(["available", "cleaning", "maintenance"] as const)
                  .filter((s) => s !== r.status)
                  .map((s) => (
                    <form action={setRoomStatus} key={s}>
                      <input type="hidden" name="roomId" value={r.id} />
                      <input type="hidden" name="status" value={s} />
                      <button className="btn sm ghost">{NEXT_LABEL[s]}</button>
                    </form>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
