import Link from "next/link";
import { getSettings } from "@/lib/db";
import { currentStaff } from "@/lib/auth";

export async function SiteHeader() {
  const s = await getSettings();
  const staff = await currentStaff();
  return (
    <header className="topbar">
      <div className="wrap">
        <Link className="brand" href="/">
          <div className="mark">K</div>
          <div>
            <b>{s.hotel_name}</b>
            <span>KUMBA · KRAMMER AVENUE</span>
          </div>
        </Link>
        <nav className="navlinks">
          <Link href="/rooms">Rooms</Link>
          <Link href="/dining">Dining</Link>
          <Link href="/find">My booking</Link>
          <Link href="/policy">Booking rules</Link>
          <Link href={staff ? "/desk" : "/login"}>{staff ? "Front desk" : "Staff sign in"}</Link>
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const s = await getSettings();
  return (
    <footer className="foot">
      <div className="wrap spread">
        <div style={{ maxWidth: "34ch" }}>
          <b>{s.hotel_name}</b>
          <p className="small" style={{ marginTop: 6 }}>
            {s.address} · {s.po_box}
            <br />
            {s.phone}
            {s.email ? " · " + s.email : ""}
          </p>
          <p className="tiny">
            Checkout {s.checkout_time} · Free unlimited internet and a smart TV in every room.
          </p>
        </div>
        <div className="small">
          <b>Book</b>
          <p className="small" style={{ marginTop: 6 }}>
            <Link href="/rooms">See the rooms</Link>
            <br />
            <Link href="/find">Find my booking</Link>
            <br />
            <Link href="/policy">Booking rules</Link>
          </p>
        </div>
        <div className="small">
          <b>Staff</b>
          <p className="small" style={{ marginTop: 6 }}>
            <Link href="/login">Front desk sign in</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
