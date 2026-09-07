import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/chrome";
import { getMenu } from "@/lib/db";
import { fcfa } from "@/lib/util";

export const revalidate = 60;

export default async function Dining() {
  const menu = await getMenu(true);
  const cats = [...new Set(menu.map((m) => m.category))];
  return (
    <>
      <SiteHeader />
      <main className="wrap section narrow">
        <div className="section-head">
          <h2>Order your meals before you arrive</h2>
          <p>Tea or coffee breakfast is already included with your room.</p>
        </div>
        {cats.map((c) => (
          <div key={c}>
            <h3 style={{ margin: "22px 0 10px" }}>{c}</h3>
            <div className="panel">
              {menu.filter((m) => m.category === c).map((m, i) => (
                <div className="spread" key={m.id}
                  style={{ padding: "11px 15px", borderTop: i ? "1px solid var(--line)" : undefined }}>
                  <div><b>{m.name}</b>{m.description && <div className="small muted">{m.description}</div>}</div>
                  <b className="nowrap">{fcfa(m.price)}</b>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p style={{ marginTop: 24 }}><Link className="btn" href="/rooms">Pick a room and add these</Link></p>
      </main>
      <SiteFooter />
    </>
  );
}
