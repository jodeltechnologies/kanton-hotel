import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import { currentStaff } from "@/lib/auth";
import { getReservationByCode, getSettings } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fcfa, money, normPhone, prettyDate } from "@/lib/util";
import type { Payment } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Printable receipt (one payment) or invoice (the whole bill). */
export default async function ReceiptPage({
  params, searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ r?: string; p?: string; invoice?: string }>;
}) {
  const { code } = await params;
  const { r: receiptNo, p, invoice } = await searchParams;
  const res = await getReservationByCode(code);
  if (!res) notFound();

  // Staff may see any file; a guest needs their own phone number in the link.
  const staff = await currentStaff();
  if (!staff && normPhone(p ?? "") !== normPhone(res.guest_phone)) notFound();

  const s = await getSettings();
  const { data } = await supabaseAdmin().from("payments").select("*")
    .eq("reservation_id", res.id).order("created_at");
  const payments = (data ?? []) as Payment[];
  const payment = invoice ? null : (receiptNo ? payments.find((x) => x.receipt_no === receiptNo) : payments.at(-1)) ?? null;
  const balance = Math.max(0, res.total - res.paid);

  return (
    <main>
      <div className="wrap noprint" style={{ padding: "18px 20px 0" }}>
        <div className="spread">
          <Link className="btn ghost sm" href={staff ? `/desk/booking/${res.code}` : "/find"}>Back</Link>
          <div className="row">
            <PrintButton label={invoice ? "Print the invoice" : "Print the receipt"} />
            {!invoice && <Link className="btn ghost" href={`/receipt/${res.code}?invoice=1${p ? `&p=${p}` : ""}`}>See the full invoice</Link>}
          </div>
        </div>
      </div>

      <div className="receipt" style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, borderBottom: "2px solid #000", paddingBottom: 10 }}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="logo" src="/logo.png" alt={s.hotel_name} />
            <h1 style={{ margin: 0, fontSize: "1.3rem" }}>{s.hotel_name}</h1>
            <div style={{ fontSize: ".85rem" }}>{s.address} · {s.po_box}<br />{s.phone}{s.email ? " · " + s.email : ""}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{invoice ? "INVOICE" : "RECEIPT"}</div>
            <div style={{ fontSize: ".85rem" }}>
              {payment ? `No. ${payment.receipt_no}` : `Booking ${res.code}`}<br />
              {new Date(payment?.created_at ?? Date.now()).toLocaleString("en-GB")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, margin: "14px 0", fontSize: ".9rem" }}>
          <div><b>Guest</b><br />{res.guest_name}<br />{res.guest_phone}{res.guest_email && <><br />{res.guest_email}</>}</div>
          <div><b>Stay</b><br />Room {res.room_label}<br />
            {prettyDate(res.check_in)} → {prettyDate(res.check_out)} ({res.nights} night{res.nights > 1 ? "s" : ""})<br />
            Checkout {s.checkout_time}</div>
          <div><b>Booking</b><br />{res.code}<br />{res.source === "walk-in" ? "Taken at the desk" : "Reserved online"}</div>
        </div>

        <table>
          <thead>
            <tr><th>Item</th><th style={{ textAlign: "right" }}>Qty</th>
              <th style={{ textAlign: "right" }}>Unit</th><th style={{ textAlign: "right" }}>Amount</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Room {res.room_label} — {res.room_name}</td>
              <td style={{ textAlign: "right" }}>{res.nights}</td>
              <td style={{ textAlign: "right" }}>{money(res.room_price)}</td>
              <td style={{ textAlign: "right" }}>{money(res.room_total)}</td>
            </tr>
            {res.food.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td style={{ textAlign: "right" }}>{f.qty}</td>
                <td style={{ textAlign: "right" }}>{money(f.price)}</td>
                <td style={{ textAlign: "right" }}>{money(f.price * f.qty)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3} style={{ textAlign: "right" }}><b>Total</b></td>
              <td style={{ textAlign: "right" }}><b>{fcfa(res.total)}</b></td></tr>
            {payment && (
              <tr><td colSpan={3} style={{ textAlign: "right" }}>
                Received now ({payment.method}{payment.reference ? " · " + payment.reference : ""})</td>
                <td style={{ textAlign: "right" }}><b>{fcfa(payment.amount)}</b></td></tr>
            )}
            {invoice && payments.map((p2) => (
              <tr key={p2.id}><td colSpan={3} style={{ textAlign: "right" }}>
                {new Date(p2.created_at).toLocaleDateString("en-GB")} · {p2.method} · {p2.receipt_no}</td>
                <td style={{ textAlign: "right" }}>{fcfa(p2.amount)}</td></tr>
            ))}
            <tr><td colSpan={3} style={{ textAlign: "right" }}>Total received</td>
              <td style={{ textAlign: "right" }}>{fcfa(res.paid)}</td></tr>
            <tr><td colSpan={3} style={{ textAlign: "right" }}><b>Balance</b></td>
              <td style={{ textAlign: "right" }}><b>{fcfa(balance)}</b></td></tr>
          </tfoot>
        </table>

        <div style={{ marginTop: 20, fontSize: ".82rem", borderTop: "1px solid #999", paddingTop: 10 }}>
          {payment && <>Served by {payment.taken_by_name}. </>}
          {balance > 0 ? "Balance payable at the desk on arrival." : "Paid in full. Thank you."}<br />
          Free unlimited internet and a smart TV in every room. {s.policy_text}<br />
          <b>{s.owner_name}</b> · {s.owner_phone}
        </div>
      </div>
    </main>
  );
}
