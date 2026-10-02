"use client";

import { useActionState, useState } from "react";
import PaymentChoice from "@/components/PaymentChoice";
import type { PaymentMode } from "@/lib/payment";
import { createBooking, type FormState } from "@/app/actions/booking";
import { fcfa, ID_TYPES, mediaUrl, money, nightsBetween, prettyDate } from "@/lib/util";
import type { Room, Settings } from "@/lib/types";

/**
 * The screen on the tablet at reception. A guest who has just walked in
 * picks a free room, gives their name and phone, and gets a booking code
 * in about thirty seconds.
 */
export default function KioskPicker({ rooms, settings, checkIn, checkOut }: {
  rooms: Room[]; settings: Pick<Settings, "checkout_time" | "advance_percent">; checkIn: string; checkOut: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createBooking, {});
  const [room, setRoom] = useState<Room | null>(null);
  const [mode, setMode] = useState<PaymentMode>("reserve");
  const nights = nightsBetween(checkIn, checkOut);
  const total = room ? room.price * nights : 0;
  const advance = Math.round((total * settings.advance_percent) / 100);

  if (!room) {
    return (
      <>
        <div className="kiosk-head">
          <h1>Welcome. Pick your room.</h1>
          <p className="lede">{prettyDate(checkIn)} to {prettyDate(checkOut)}. Checkout {settings.checkout_time}. Prices are per night.</p>
        </div>
        {rooms.length === 0 ? (
          <div className="notice bad kiosk-wide">
            No rooms are available for these dates. Choose other dates or speak to reception.
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
      <input type="hidden" name="checkIn" value={checkIn} />
      <input type="hidden" name="checkOut" value={checkOut} />
      <input type="hidden" name="arrival" value="now" />
      <input type="hidden" name="food" value="{}" />

      <div className="spread" style={{ alignItems: "center" }}>
        <h1>Room {room.number}</h1>
        <button type="button" className="btn ghost" onClick={() => setRoom(null)}>Choose another room</button>
      </div>

      <div className="grid kiosk-booking" style={{ marginTop: 18 }}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl(room.photos[0] ?? "bed")} alt={room.name}
            style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: "var(--r)" }} />
          <div className="amen" style={{ marginTop: 12 }}>
            {room.amenities.map((a) => <span className="chip teal" key={a}>{a}</span>)}
          </div>

          <p className="small" style={{ marginTop: 16 }}>{prettyDate(checkIn)} to {prettyDate(checkOut)}. {nights} night{nights > 1 ? "s" : ""}.</p>

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
          <PaymentChoice mode={mode} onChange={setMode} advance={advance} total={total} advancePercent={settings.advance_percent} />
          <div className="sumline due"><span>Pay now</span><span>{fcfa(mode === "full" ? total : advance)}</span></div>
          <div className="sumline small"><span className="muted">Balance after payment</span><span>{fcfa(mode === "full" ? 0 : total - advance)}</span></div>
          <hr />
          <label className="checkline">
            <input type="checkbox" name="agree" required />
            <span>I agree to the house rules: the room is only held once the advance is paid, and checkout is
              {" "}{settings.checkout_time}.</span>
          </label>
          <button className="btn block" style={{ marginTop: 14, fontSize: "1.05rem", padding: "14px 18px" }} disabled={pending}>
            {pending ? "One moment…" : mode === "full" ? "Continue to full payment" : "Reserve this room"}
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
