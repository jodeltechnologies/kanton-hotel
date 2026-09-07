import Link from "next/link";
import { SiteHeader } from "@/components/chrome";
import LoginForm from "./LoginForm";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ next?: string; created?: string }> }) {
  const { next = "/desk", created } = await searchParams;
  const { count } = await supabaseAdmin().from("staff").select("id", { count: "exact", head: true });

  return (
    <>
      <SiteHeader />
      <main className="wrap section narrow">
        <div className="panel pad" style={{ maxWidth: 430, margin: "0 auto" }}>
          <h2>Front desk</h2>
          <p className="small muted">Staff only. The owner creates these accounts.</p>
          {created && <div className="notice ok" style={{ marginBottom: 12 }}>Owner account created. Sign in with it.</div>}
          <LoginForm next={next} />
          {(count ?? 0) === 0 && (
            <div className="notice" style={{ marginTop: 14 }}>
              No staff accounts exist yet. <Link href="/setup">Create the owner account</Link>.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
