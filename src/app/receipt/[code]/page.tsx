import { notFound } from "next/navigation";
import ThermalReceipt from "@/components/ThermalReceipt";
import { currentStaff } from "@/lib/auth";
import { getReservationByCode, getSettings } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fcfa, money, normPhone, prettyDate, SOURCE_LABEL } from "@/lib/util";
import type { Payment } from "@/lib/types";

export const dynamic = "force-dynamic";

/** A numbered payment receipt, full invoice, or clearly labelled unpaid booking slip. */
export default async function ReceiptPage({ params, searchParams }: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ r?: string; p?: string; invoice?: string }>;
}) {
  const { code } = await params;
  const { r: receiptNo, p, invoice } = await searchParams;
  const res = await getReservationByCode(code);
  if (!res) notFound();
  const staff = await currentStaff();
  if (!staff && normPhone(p ?? "") !== normPhone(res.guest_phone)) notFound();

  const [s, { data, error }] = await Promise.all([
    getSettings(),
    supabaseAdmin().from("payments").select("*").eq("reservation_id", res.id).order("created_at"),
  ]);
  if (error) throw new Error("The payment records could not be loaded. Please try again.");
  const payments = (data ?? []) as Payment[];
  const payment = invoice ? null : (receiptNo ? payments.find((item) => item.receipt_no === receiptNo) : payments.at(-1)) ?? null;
  if (receiptNo && !payment && !invoice) notFound();
  const balance = Math.max(0, res.total - res.paid);
  const title = invoice ? "INVOICE" : payment ? "PAYMENT RECEIPT" : "RESERVATION SLIP";
  const invoiceQuery = new URLSearchParams({ invoice: "1", ...(p ? { p } : {}) });

  return (
    <ThermalReceipt backHref={staff ? `/desk/booking/${res.code}` : "/find"}
      invoiceHref={!invoice ? `/receipt/${res.code}?${invoiceQuery}` : undefined}
      label={invoice ? "Print invoice" : payment ? "Print receipt" : "Print reservation slip"}>
      <header className="receipt-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="receipt-logo" src="/logo.png" alt={s.hotel_name} width={150} />
        <h1>{s.hotel_name}</h1>
        <div>{s.address}{s.po_box && <><br />{s.po_box}</>}</div>
        <div>{s.phone}{s.email && <><br />{s.email}</>}</div>
        <h2>{title}</h2>
        <div>{payment ? `No. ${payment.receipt_no}` : `Booking ${res.code}`}</div>
        <div>{new Date(payment?.created_at ?? res.created_at).toLocaleString("en-GB", { timeZone: "Africa/Douala" })}</div>
      </header>

      <section className="receipt-details">
        <div><b>Guest:</b> {res.guest_name}</div>
        <div><b>Phone:</b> {res.guest_phone}</div>
        {res.guest_email && <div><b>Email:</b> {res.guest_email}</div>}
        <div><b>Booking:</b> {res.code}</div>
        <div><b>Room:</b> {res.room_label} ({res.room_name})</div>
        <div><b>Arrival:</b> {prettyDate(res.check_in)}</div>
        <div><b>Departure:</b> {prettyDate(res.check_out)}</div>
        <div><b>Stay:</b> {res.nights} night{res.nights > 1 ? "s" : ""}. Checkout {s.checkout_time}</div>
        <div><b>Booked:</b> {SOURCE_LABEL[res.source]}</div>
      </section>

      <table className="receipt-items">
        <colgroup><col /><col style={{ width: "32%" }} /></colgroup>
        <thead><tr><th>Item</th><th className="right">FCFA</th></tr></thead>
        <tbody>
          <tr><td>Room {res.room_label}<small>{res.nights} × {money(res.room_price)}</small></td>
            <td className="right">{money(res.room_total)}</td></tr>
          {res.food.map((f) => <tr key={f.id}><td>{f.name}<small>{f.qty} × {money(f.price)}</small></td>
            <td className="right">{money(f.price * f.qty)}</td></tr>)}
        </tbody>
      </table>

      <section className="receipt-totals">
        <div className="receipt-line strong"><span>Total stay</span><b>{fcfa(res.total)}</b></div>
        {payment && <>
          <div className="receipt-line strong"><span>Received now</span><b>{fcfa(payment.amount)}</b></div>
          <div>Method: {payment.method}</div>
          {payment.reference && <div>Reference: {payment.reference}</div>}
        </>}
        {invoice && payments.length > 0 && <div className="receipt-payment-log">
          <b>Payments received</b>
          {payments.map((item) => <div key={item.id} className="receipt-payment-entry">
            <div className="receipt-line"><span>{new Date(item.created_at).toLocaleDateString("en-GB", { timeZone: "Africa/Douala" })}</span><b>{fcfa(item.amount)}</b></div>
            <div>{item.method} · {item.receipt_no}</div>
            {item.reference && <div>Reference: {item.reference}</div>}
          </div>)}
        </div>}
        <div className="receipt-line"><span>Total received</span><span>{fcfa(res.paid)}</span></div>
        <div className="receipt-line strong"><span>Balance due</span><b>{fcfa(balance)}</b></div>
      </section>

      <footer className="receipt-footer">
        {!payment && !invoice && res.paid === 0 && <p><b>Awaiting payment. This slip is not proof of payment.</b>
          <br />Advance to secure the room: {fcfa(res.advance_due)}. You may also pay in full.</p>}
        {payment && <p>Served by {payment.taken_by_name}.</p>}
        <p>{balance > 0 ? "Balance payable before or on arrival." : "Paid in full. Thank you."}</p>
        <p>{s.policy_text}</p>
        {(s.owner_name || s.owner_phone) && <p>{s.owner_name}{s.owner_phone && <><br />{s.owner_phone}</>}</p>}
        <p>Thank you for choosing {s.hotel_name}.</p>
      </footer>
    </ThermalReceipt>
  );
}
