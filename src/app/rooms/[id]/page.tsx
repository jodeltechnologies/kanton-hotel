import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/chrome";
import { RoomBadge } from "@/components/bits";
import { getRooms, getSettings, roomIsTaken } from "@/lib/db";
import { addDays, mediaUrl, money, todayISO } from "@/lib/util";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [rooms, s] = await Promise.all([getRooms(true), getSettings()]);
  const room = rooms.find((r) => r.id === id);
  if (!room) notFound();
  const taken = await roomIsTaken(room.id, todayISO(), addDays(todayISO(), 1));
  const status = taken && room.status === "available" ? "occupied" : room.status;

  return (
    <>
      <SiteHeader />
      <main className="wrap section">
        <p className="small"><Link href="/rooms">Rooms</Link> <span className="muted">/ room {room.number}</span></p>
        <div className="grid" style={{ gridTemplateColumns: "minmax(0,1.35fr) minmax(280px,1fr)", alignItems: "start" }}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl(room.photos[0] ?? "bed")} alt={room.name}
              style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: "var(--r)" }} />
            <div className="gallery" style={{ marginTop: 10, gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))" }}>
              {room.photos.slice(1).map((k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={k} src={mediaUrl(k)} alt={room.name} style={{ cursor: "default" }} />
              ))}
            </div>
            {(room.videos ?? []).length > 0 && (
              <>
                <h3 style={{ marginTop: 24 }}>Walk through the room</h3>
                {room.videos.map((v) => (
                  <video key={v} src={v} controls playsInline preload="metadata"
                    style={{ width: "100%", marginTop: 10, borderRadius: "var(--r)", background: "#000" }} />
                ))}
              </>
            )}
            <h2 style={{ marginTop: 24 }}>{room.name} · {room.number}</h2>
            <p style={{ marginTop: 8 }}>{room.description}</p>
            <h3 style={{ marginTop: 20 }}>What is in the room</h3>
            <div className="amen" style={{ marginTop: 10 }}>
              {room.amenities.map((a) => <span className="chip teal" key={a}>{a}</span>)}
            </div>
          </div>
          <aside className="panel pad" style={{ position: "sticky", top: 80 }}>
            <div className="spread">
              <div><div className="code">{money(room.price)}</div><span className="small muted">FCFA per night</span></div>
              <RoomBadge status={status} />
            </div>
            <hr style={{ margin: "14px 0" }} />
            <div className="sumline"><span className="muted">Floor</span><b>{room.floor}</b></div>
            <div className="sumline"><span className="muted">Bed</span><b>{room.bed}</b></div>
            <div className="sumline"><span className="muted">Sleeps</span><b>{room.capacity}</b></div>
            <div className="sumline"><span className="muted">Checkout</span><b>{s.checkout_time}</b></div>
            <div className="sumline"><span className="muted">Advance to hold it</span><b>{s.advance_percent}%</b></div>
            <Link className="btn block" style={{ marginTop: 14 }} href={`/book?room=${room.id}`}>Reserve this room</Link>
            <p className="tiny muted" style={{ marginTop: 10 }}>
              Pay the advance by Mobile Money right after you book. Until it lands, a guest paying at the desk can take the room.
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
