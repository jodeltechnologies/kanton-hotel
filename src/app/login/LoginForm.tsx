"use client";
import { useActionState } from "react";
import { signIn, type FormState } from "@/app/actions/admin";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />
      <label className="field"><span>Work email</span>
        <input type="email" name="email" autoComplete="username" required /></label>
      <label className="field"><span>Password</span>
        <input type="password" name="password" autoComplete="current-password" required /></label>
      <button className="btn block" disabled={pending}>{pending ? "Checking…" : "Sign in"}</button>
      {state.error && <div className="notice bad form-msg">{state.error}</div>}
    </form>
  );
}
