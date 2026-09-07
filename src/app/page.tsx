import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/chrome";
import { RoomCard } from "@/components/bits";
import { getRooms, getSettings } from "@/lib/db";
import { money, photoUrl } from "@/lib/util";

export const revalidate = 30;

export default async function Home() {
  const [s, rooms] = await Promise.all([getSettings(), getRooms(true)]);
  const cheapest = rooms.length ? Math.min(...rooms.map((r) => r.price)) : 13000;
  const free = rooms.filter((r) => r.status === "available").length;
  const picks = ["standard", "modern", "vip", "executive"]
    .map((c) => rooms.find((r) => r.category === c))
    .filter(Boolean) as typeof rooms;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="bg" src={photoUrl("hero")} alt="The black-glass entrance of Kanton Hotel" />
          <div className="veil" />
          <div className="wrap">
            <h1>Reserve your room before you travel to Kumba.</h1>
            <div className="rule" />
            <p className="lede">
              {s.tagline} Pick your room, add your meals, pay the {s.advance_percent}% advance by
              Mobile Money and walk straight to your key.
            </p>
            <div className="row" style={{ marginTop: 22 }}>
              <Link className="btn" href="/rooms">Choose a room</Link>
              <Link className="btn ghost" href="/find" style={{ color: "#fff", borderColor: "rgba(255,255,255,.45)" }}>
                Find my booking
              </Link>
            </div>
            <div className="keyfacts">
              <div><b>{money(cheapest)}</b><small>FCFA a night, from</small></div>
              <div><b>{free}</b><small>rooms free right now</small></div>
              <div><b>Free</b><small>unlimited internet</small></div>
              <div><b>{s.checkout_time}</b><small>checkout</small></div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <h2>How a booking works</h2>
              <p>Four steps, about three minutes.</p>
            </div>
            <ol className="stepnums grid g2" style={{ padding: 0, margin: 0 }}>
              <li><div><b>Pick your room and meals</b>
                <p className="small muted">Every room shows its photos, its price and what is inside it.</p></div></li>
              <li><div><b>Pay the {s.advance_percent}% advance</b>
                <p className="small muted">One tap opens your dialler with the Mobile Money code already filled in.</p></div></li>
              <li><div><b>Send the screenshot</b>
                <p className="small muted">Not compulsory, but it settles any argument at the desk.</p></div></li>
              <li><div><b>Collect your key</b>
                <p className="small muted">Reception confirms the advance and the balance is paid on arrival.</p></div></li>
            </ol>
            <div className="notice" style={{ marginTop: 22 }}>
              <b>An unpaid booking is not a held room.</b> {s.policy_text}{" "}
              <Link href="/policy">Read the booking rules</Link>.
            </div>
          </div>
        </section>

        <section className="section" style={{ background: "var(--surface-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <div className="wrap">
            <div className="section-head"><h2>The rooms</h2><p>Four categories, {rooms.length} rooms.</p></div>
            <div className="grid g3">{picks.map((r) => <RoomCard key={r.id} room={r} />)}</div>
            <p style={{ marginTop: 20 }}><Link className="btn ghost" href="/rooms">See all rooms and prices</Link></p>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head"><h2>Inside the house</h2><p>Photographed this month.</p></div>
            <div className="gallery">
              {["lobby", "lounge", "entrance", "sitting", "bed", "facade"].map((k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={k} src={photoUrl(k)} alt="Kanton Hotel" style={{ cursor: "default" }} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
