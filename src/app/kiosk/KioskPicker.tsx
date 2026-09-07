"use client";

import { useActionState, useState } from "react";
import { createBooking, type FormState } from "@/app/actions/booking";
import { addDays, fcfa, ID_TYPES, mediaUrl, money, todayISO } from "@/lib/util";
import type { Room, Settings } from "@/lib/types";

/**
 * The screen on the tablet at reception. A guest who has just walked in
 * picks a free room, gives their name and phone, and gets a booking code
 * in about thirty seconds.
 */
export default function KioskPicker({ rooms, settings }: { rooms: Room[]; settings: Settings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createBooking, {});
  const [room, setRoom] = useState<Room | null>(null);
  const [nights, setNights] = useState(1);

  const today = todayISO();
  const total = room ? room.price * nights : 0;
  const advance = Math.round((total * settings.advance_percent) / 100);

  if (!room) {
    return (
      <>
        <div className="kiosk-head">
          <h1>Welcome. Pick your room.</h1>
          <p className="lede">Free for tonight, {settings.checkout_time} checkout tomorrow. Prices are per night.</p>
        </div>
        {rooms.length === 0 ? (
          <div className="notice bad kiosk-wide">
            Every room is taken tonight. Please speak to the receptionist — they keep a waiting list.
          </div>
        ) : (
          <div className="grid g3 kiosk-wide">
            {rooms.map((r) => (
              <button key={r.id} className="kiosk-room" onClick={() => setRoom(r)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(r.photos[0] ?? "bed")} alt={r.name} />
                <div className="kiosk-room-body">
                  <b className="slab" style={{ fontSize: "1.35rem" }}>{r.number} · {r.name}</b>
                  <div className="small muted">{r.bed} · sleeps {r.capacity} · floor {r.floor}</div>
                  <div className="amen" style={{ marginTop: 8 }}>
                    {r.amenities.slice(0, 3).map((a) => <span className="chip" key={a}>{a}</span>)}
                  </div>
                  <div className="kiosk-price">{money(r.price)} <span>FCFA / night</span></div>
                </div>
              </button>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <form action={action} className="kiosk-wide">
      <input type="hidden" name="source" value="kiosk" />
      <input type="hidden" name="roomId" value={room.id} />
      <input type="hidden" name="checkIn" value={today} />
      <input type="hidden" name="checkOut" value={addDays(today, nights)} />
      <input type="hidden" name="arrival" value="now" />
      <input type="hidden" name="food" value="{}" />

      <div className="spread" style={{ alignItems: "center" }}>
        <h1>Room {room.number}</h1>
        <button type="button" className="btn ghost" onClick={() => setRoom(null)}>Choose another room</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(300px,.8fr)", alignItems: "start", marginTop: 18 }}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl(room.photos[0] ?? "bed")} alt={room.name}
            style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: "var(--r)" }} />
          <div className="amen" style={{ marginTop: 12 }}>
            {room.amenities.map((a) => <span className="chip teal" key={a}>{a}</span>)}
          </div>

          <h3 style={{ marginTop: 20 }}>How many nights?</h3>
          <div className="row" style={{ marginTop: 8 }}>
            {[1, 2, 3, 4, 5, 7].map((n) => (
              <button type="button" key={n} className={"kiosk-night" + (nights === n ? " on" : "")}
                onClick={() => setNights(n)}>{n}</button>
            ))}
          </div>

          <h3 style={{ marginTop: 22 }}>Your details</h3>
          <div className="grid g2" style={{ gap: "0 14px" }}>
            <label className="field"><span>Full name</span>
              <input type="text" name="name" required autoComplete="off" /></label>
            <label className="field"><span>Phone number</span>
              <input type="tel" name="phone" inputMode="numeric" required placeholder="6XX XXX XXX" /></label>
            <label className="field"><span>Email (for your confirmation — optional)</span>
              <input type="email" name="email" autoComplete="off" /></label>
            <label className="field"><span>Guests</span>
              <input type="number" name="guests" min={1} max={room.capacity} defaultValue={1} /></label>
            <label className="field"><span>Type of ID</span>
              <select name="idType" defaultValue={ID_TYPES[0]}>
                {ID_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select></label>
            <label className="field"><span>ID card number</span>
              <input type="text" name="idNumber" style={{ textTransform: "uppercase" }} /></label>
          </div>
        </div>

        <aside className="panel pad" style={{ position: "sticky", top: 16 }}>
          <h3>What you pay</h3>
          <div className="sumline">
            <span>{nights} night{nights > 1 ? "s" : ""} × {money(room.price)}</span><b>{fcfa(total)}</b>
          </div>
          <div className="sumline total"><span>Total</span><span>{fcfa(total)}</span></div>
          <div className="sumline due">
            <span>Advance to hold it ({settings.advance_percent}%)</span><span>{fcfa(advance)}</span>
          </div>
          <div className="sumline small"><span className="muted">Balance at the desk</span><span>{fcfa(total - advance)}</span></div>
          <hr />
          <label className="checkline">
            <input type="checkbox" name="agree" required />
            <span>I agree to the house rules: the room is only held once the advance is paid, and checkout is
              {" "}{settings.checkout_time}.</span>
          </label>
          <button className="btn block" style={{ marginTop: 14, fontSize: "1.05rem", padding: "14px 18px" }} disabled={pending}>
            {pending ? "One moment…" : "Reserve this room"}
          </button>
          {state.error && <div className="notice bad form-msg">{state.error}</div>}
          <p className="tiny muted" style={{ marginTop: 10 }}>
            The receptionist takes your payment at the desk, or you can pay by Mobile Money from your own phone on the
            next screen.
          </p>
        </aside>
      </div>
    </form>
  );
}
