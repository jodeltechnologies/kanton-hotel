import Link from "next/link";
import { SiteHeader } from "@/components/chrome";
import SetupForm from "./SetupForm";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const { count } = await supabaseAdmin().from("staff").select("id", { count: "exact", head: true });
  const done = (count ?? 0) > 0;
  return (
    <>
      <SiteHeader />
      <main className="wrap section narrow">
        <div className="panel pad" style={{ maxWidth: 460, margin: "0 auto" }}>
          <h2>Set up the hotel</h2>
          {done ? (
            <div className="notice">
              This hotel already has staff accounts, so setup is closed.{" "}
              <Link href="/login">Sign in</Link> instead.
            </div>
          ) : (
            <>
              <p className="small muted">
                This page works once. It creates the owner account, which can then create every other account.
              </p>
              <SetupForm />
            </>
          )}
        </div>
      </main>
    </>
  );
}
