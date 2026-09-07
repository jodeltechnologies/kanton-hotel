import Link from "next/link";
import { RES_LABEL, ROOM_LABEL, money, photoUrl } from "@/lib/util";
import type { Reservation, Room } from "@/lib/types";

export const ResBadge = ({ r }: { r: Reservation }) => (
  <span className={"state s-" + r.status}>{RES_LABEL[r.status] ?? r.status}</span>
);
export const RoomBadge = ({ status }: { status: string }) => (
  <span className={"state s-" + status}>{ROOM_LABEL[status] ?? status}</span>
);

export function RoomCard({ room, taken }: { room: Room; taken?: boolean }) {
  const status = taken && room.status === "available" ? "occupied" : room.status;
  return (
    <article className="roomcard">
      <div className="shot">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl(room.photos[0] ?? "bed")} alt={`${room.name} ${room.number}`} loading="lazy" />
        <div className="tag">
          {money(room.price)} <span style={{ fontSize: ".72em" }}>FCFA / night</span>
        </div>
      </div>
      <div className="body">
        <div className="spread" style={{ gap: 8 }}>
          <h3>{room.name}</h3>
          <RoomBadge status={status} />
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          Room {room.number} · floor {room.floor} · {room.bed} · up to {room.capacity} guests
        </p>
        <div className="amen">
          {room.amenities.slice(0, 3).map((a) => (
            <span className="chip" key={a}>{a}</span>
          ))}
          {room.amenities.length > 3 && <span className="chip">+{room.amenities.length - 3} more</span>}
        </div>
        <div className="row" style={{ marginTop: "auto", paddingTop: 8 }}>
          <Link className="btn sm ghost" href={`/rooms/${room.id}`}>See inside</Link>
          <Link className="btn sm" href={`/book?room=${room.id}`}>Reserve</Link>
        </div>
      </div>
    </article>
  );
}
