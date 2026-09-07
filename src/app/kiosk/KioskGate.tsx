"use client";
import { useActionState } from "react";
import { unlockKiosk, type FormState } from "@/app/actions/booking";

export default function KioskGate() {
  const [state, action, pending] = useActionState<FormState, FormData>(unlockKiosk, {});
  return (
    <div className="kiosk-center">
      <div className="panel pad" style={{ maxWidth: 420, width: "100%" }}>
        <h2>Reception tablet</h2>
        <p className="small muted">Enter the tablet PIN once. This device stays unlocked for 30 days.</p>
        <form action={action}>
          <label className="field"><span>PIN</span>
            <input type="password" name="pin" inputMode="numeric" autoFocus required
              style={{ fontSize: "1.6rem", textAlign: "center", letterSpacing: ".4em" }} /></label>
          <button className="btn block" disabled={pending}>{pending ? "Checking…" : "Unlock"}</button>
        </form>
        {state.error && <div className="notice bad form-msg">{state.error}</div>}
      </div>
    </div>
  );
}
