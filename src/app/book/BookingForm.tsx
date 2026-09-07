"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createBooking, type FormState } from "@/app/actions/booking";
import { addDays, fcfa, money, nightsBetween, todayISO } from "@/lib/util";
import type { MenuItem, Room } from "@/lib/types";

export default function BookingForm({
  rooms, menu, advancePercent, preselect, atDesk = false,
}: {
  rooms: Room[]; menu: MenuItem[]; advancePercent: number; preselect?: string; atDesk?: boolean;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createBooking, {});
  const [roomId, setRoomId] = useState(preselect ?? "");
  const [checkIn, setCheckIn] = useState(todayISO());
  const [checkOut, setCheckOut] = useState(addDays(todayISO(), 1));
  const [food, setFood] = useState<Record<string, number>>({});

  const room = rooms.find((r) => r.id === roomId);
  const nights = Math.max(1, nightsBetween(checkIn, checkOut));
  const lines = useMemo(
    () => Object.entries(food).filter(([, q]) => q > 0).map(([id, qty]) => {
      const m = menu.find((x) => x.id === id)!;
      return { id, name: m.name, price: m.price, qty, line: m.price * qty };
    }), [food, menu]);
  const foodTotal = lines.reduce((a, l) => a + l.line, 0);
  const roomTotal = room ? room.price * nights : 0;
  const total = roomTotal + foodTotal;
  const advance = Math.round((total * advancePercent) / 100);
  const cats = [...new Set(menu.map((m) => m.category))];
  const bump = (id: string, d: number) =>
    setFood((f) => ({ ...f, [id]: Math.max(0, (f[id] ?? 0) + d) }));

  return (
    <form action={formAction}>
      <input type="hidden" name="food" value={JSON.stringify(food)} />
      <input type="hidden" name="source" value={atDesk ? "walk-in" : "online"} />
      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1.4fr) minmax(290px,1fr)", alignItems: "start" }}>
        <div>
          <fieldset>
            <legend>Room and dates</legend>
            <label className="field"><span>Room</span>
              <select name="roomId" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                <option value="">Choose a room…</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.number} · {r.name} — {money(r.price)} FCFA/night
                  </option>
                ))}
              </select>
            </label>
            <div className="grid g2" style={{ gap: "0 14px" }}>
              <label className="field"><span>Arriving</span>
                <input type="date" name="checkIn" min={atDesk ? undefined : todayISO()} value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (checkOut <= e.target.value) setCheckOut(addDays(e.target.value, 1));
                  }} /></label>
              <label className="field"><span>Leaving</span>
                <input type="date" name="checkOut" min={addDays(checkIn, 1)} value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)} /></label>
              <label className="field"><span>Guests</span>
                <input type="number" name="guests" min={1} max={4} defaultValue={1} /></label>
              <label className="field"><span>Expected arrival time</span>
                <select name="arrival" defaultValue="afternoon">
                  <option value="morning">Morning (before 12:00)</option>
                  <option value="afternoon">Afternoon (12:00 – 18:00)</option>
                  <option value="evening">Evening (after 18:00)</option>
                  <option value="late">Late night</option>
                </select></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Who is staying</legend>
            <label className="field"><span>Full name</span>
              <input type="text" name="name" placeholder="As on your ID" required /></label>
            <div className="grid g2" style={{ gap: "0 14px" }}>
              <label className="field"><span>Phone (the number you will pay with)</span>
                <input type="tel" name="phone" placeholder="6XX XXX XXX" required /></label>
              <label className="field"><span>Email (optional)</span>
                <input type="email" name="email" /></label>
            </div>
            <label className="field"><span>Anything we should know? (optional)</span>
              <textarea name="note" placeholder="Late arrival, extra mattress, quiet floor…" /></label>
          </fieldset>

          <fieldset>
            <legend>Meals waiting for you (optional)</legend>
            <p className="small muted">Tea or coffee breakfast is already included.</p>
            {cats.map((c) => (
              <div key={c}>
                <h4 style={{ margin: "14px 0 6px", fontSize: ".95rem" }}>{c}</h4>
                {menu.filter((m) => m.category === c).map((m) => (
                  <div className="spread" key={m.id}
                    style={{ padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ minWidth: 150 }}>
                      <b className="small">{m.name}</b>
                      <span className="small muted"> · {fcfa(m.price)}</span>
                    </div>
                    <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                      <button type="button" className="btn sm ghost" disabled={!food[m.id]}
                        onClick={() => bump(m.id, -1)} aria-label={`Remove one ${m.name}`}>−</button>
                      <b style={{ minWidth: 22, textAlign: "center" }}>{food[m.id] ?? 0}</b>
                      <button type="button" className="btn sm ghost"
                        onClick={() => bump(m.id, 1)} aria-label={`Add one ${m.name}`}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </fieldset>
        </div>

        <aside className="panel pad" style={{ position: "sticky", top: 80 }}>
          <h3>Summary</h3>
          {room ? (
            <div className="sumline">
              <span>{room.name} {room.number}<br />
                <span className="small muted">{nights} night{nights > 1 ? "s" : ""} × {money(room.price)}</span></span>
              <b>{fcfa(roomTotal)}</b>
            </div>
          ) : <p className="small muted">Choose a room to see the price.</p>}
          {lines.map((l) => (
            <div className="sumline small" key={l.id}><span>{l.name} × {l.qty}</span><span>{fcfa(l.line)}</span></div>
          ))}
          {foodTotal > 0 && <div className="sumline"><span className="muted">Meals</span><b>{fcfa(foodTotal)}</b></div>}
          <div className="sumline total"><span>Total stay</span><span>{fcfa(total)}</span></div>
          <div className="sumline due"><span>Advance ({advancePercent}%)</span><span>{fcfa(advance)}</span></div>
          <div className="sumline small"><span className="muted">Balance on arrival</span><span>{fcfa(total - advance)}</span></div>
          <hr />
          {!atDesk && (
            <label className="checkline">
              <input type="checkbox" name="agree" required />
              <span>I have read the booking rules: the room is only held once the advance is received, and if I book
                and do not come — or come days late — the advance is kept and the room is released.{" "}
                <Link href="/policy">Read them</Link>.</span>
            </label>
          )}
          <button className="btn block" style={{ marginTop: 14 }} disabled={pending || !room || !total}>
            {pending ? "Saving…" : atDesk ? "Create the booking" : "Reserve and go to payment"}
          </button>
          {state.error && <div className="notice bad form-msg">{state.error}</div>}
          <p className="tiny muted" style={{ marginTop: 8 }}>
            You get a booking code on the next screen. Keep it — reception finds your file with it.
          </p>
        </aside>
      </div>
    </form>
  );
}
