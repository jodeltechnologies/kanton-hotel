"use client";
import { useActionState } from "react";
import { changeMyPassword, type FormState } from "@/app/actions/admin";

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changeMyPassword, {});
  return (
    <form action={action}>
      <label className="field"><span>New password</span>
        <input type="password" name="password" minLength={8} required /></label>
      <label className="field"><span>Type it again</span>
        <input type="password" name="password2" minLength={8} required /></label>
      <button className="btn ghost" disabled={pending}>Change my password</button>
      {state.error && <div className="notice bad form-msg">{state.error}</div>}
      {state.ok && <div className="notice ok form-msg">{state.ok}</div>}
    </form>
  );
}
