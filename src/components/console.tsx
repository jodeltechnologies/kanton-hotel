import Link from "next/link";
import { SiteHeader } from "./chrome";
import { ROLES, can } from "@/lib/roles";
import { signOut } from "@/app/actions/admin";
import type { Staff } from "@/lib/types";

export function ConsoleShell({
  staff, pending = 0, children,
}: { staff: Staff; pending?: number; children: React.ReactNode }) {
  const item = (href: string, label: string, perm?: string) =>
    !perm || can(staff.role, perm) ? <Link key={href} href={href}>{label}</Link> : null;

  return (
    <>
      <SiteHeader />
      <div className="console">
        <aside className="side">
          <div className="who">
            <b>{staff.full_name}</b>
            <span className="small">{ROLES[staff.role].label}</span>
          </div>
          <nav>
            <h4>FRONT DESK</h4>
            {item("/desk", "Today", "desk")}
            {item("/desk/reservations", "Bookings" + (pending ? ` (${pending})` : ""), "reservations")}
            {item("/desk/new", "New booking at the desk", "reservations")}
            {item("/desk/rooms", "Room board", "rooms")}
            {item("/desk/reports", "Takings", "reports")}
            {item("/kiosk", "Reception tablet", "reservations")}
            <h4>MANAGEMENT</h4>
            {item("/admin", "Hotel settings", "*")}
            {item("/admin/staff", "Staff accounts", "*")}
            {item("/admin/rooms", "Rooms & prices", "rooms")}
            {item("/admin/menu", "Food menu", "menu")}
            {item("/admin/blacklist", "No-show list", "blacklist")}
            {item("/admin/profile", "My profile", "desk")}
            <h4>&nbsp;</h4>
            <Link href="/">Guest site</Link>
            <form action={signOut}>
              <button className="linkbtn" style={{ color: "var(--on-ink-dim)", padding: "8px 10px" }}>Sign out</button>
            </form>
          </nav>
        </aside>
        <section className="main">{children}</section>
      </div>
    </>
  );
}

export const Denied = () => (
  <div className="notice bad">Your role cannot open this page. Ask the owner.</div>
);
