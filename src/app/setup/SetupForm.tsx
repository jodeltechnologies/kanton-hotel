"use client";
import { useActionState } from "react";
import { bootstrapOwner, type FormState } from "@/app/actions/admin";

export default function SetupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(bootstrapOwner, {});
  return (
    <form action={action}>
      <label className="field"><span>Your name</span><input type="text" name="full_name" required /></label>
      <label className="field"><span>Email you will sign in with</span><input type="email" name="email" required /></label>
      <label className="field"><span>Password (8 characters or more)</span>
        <input type="password" name="password" minLength={8} required /></label>
      <button className="btn block" disabled={pending}>{pending ? "Creating…" : "Create the owner account"}</button>
      {state.error && <div className="notice bad form-msg">{state.error}</div>}
    </form>
  );
}
