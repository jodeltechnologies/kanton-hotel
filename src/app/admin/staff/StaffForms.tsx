"use client";
import { useActionState } from "react";
import { createStaff, resetPassword, type FormState } from "@/app/actions/admin";
import { ROLES } from "@/lib/roles";

export function NewStaffForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createStaff, {});
  return (
    <form action={action} className="panel pad" style={{ marginTop: 18 }}>
      <h3>Add someone</h3>
      <div className="grid g2" style={{ gap: "0 12px" }}>
        <label className="field"><span>Full name</span><input type="text" name="full_name" required /></label>
        <label className="field"><span>Phone</span><input type="tel" name="phone" /></label>
        <label className="field"><span>Work email (this is their username)</span>
          <input type="email" name="email" required /></label>
        <label className="field"><span>Starting password</span>
          <input type="text" name="password" minLength={8} required /></label>
      </div>
      <label className="field"><span>Role</span>
        <select name="role" defaultValue="receptionist">
          {Object.entries(ROLES).filter(([k]) => k !== "owner").map(([k, r]) => (
            <option key={k} value={k}>{r.label}</option>
          ))}
        </select></label>
      <button className="btn" disabled={pending}>{pending ? "Creating…" : "Create the account"}</button>
      {state.error && <div className="notice bad form-msg">{state.error}</div>}
      {state.ok && <div className="notice ok form-msg">{state.ok}</div>}
    </form>
  );
}

export function ResetPasswordForm({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {});
  return (
    <form action={action} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
      <input type="hidden" name="id" value={id} />
      <input type="text" name="password" placeholder={`New password for ${name}`} minLength={8}
        style={{ minWidth: 170 }} />
      <button className="btn sm ghost" disabled={pending}>Set</button>
      {state.error && <span className="tiny" style={{ color: "var(--bad)" }}>{state.error}</span>}
      {state.ok && <span className="tiny" style={{ color: "var(--ok)" }}>Done</span>}
    </form>
  );
}
