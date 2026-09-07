import { requireStaff } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { updateBlacklist } from "@/app/actions/admin";
import { stamp } from "@/lib/util";
import type { BlacklistRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Blacklist() {
  await requireStaff("blacklist");
  const s = await getSettings();
  const { data } = await supabaseAdmin().from("blacklist").select("*").order("last_at", { ascending: false });
  const rows = (data ?? []) as BlacklistRow[];

  return (
    <>
      <h2>No-show list</h2>
      <p className="small muted">
        A number gets a strike each time a booking is marked a no-show. At {s.strike_limit} strikes it can no longer
        book online.
      </p>
      {rows.length ? (
        <div className="tablewrap" style={{ marginTop: 16 }}>
          <table>
            <thead><tr><th>Phone</th><th>Name</th><th>Strikes</th><th>Blocked</th><th>Last</th><th /></tr></thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td><b>{b.phone}</b></td>
                  <td>{b.name || "—"}</td>
                  <td>{b.strikes}</td>
                  <td>{b.banned || b.strikes >= s.strike_limit
                    ? <span className="state s-cancelled">Blocked</span>
                    : <span className="state s-available">Can book</span>}</td>
                  <td className="small muted">{stamp(b.last_at)}{b.reason && <><br />{b.reason}</>}</td>
                  <td className="acts">
                    <form action={updateBlacklist} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="what" value="toggle" />
                      <button className="btn sm ghost">{b.banned ? "Unblock" : "Block now"}</button>
                    </form>
                    <form action={updateBlacklist} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="what" value="forgive" />
                      <button className="btn sm ghost">Forgive</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="panel pad muted small" style={{ marginTop: 16 }}>Nobody on the list. Good.</div>}
    </>
  );
}
