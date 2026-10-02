"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/** Keep the browser preview and printed roll the same width, including Ctrl+P. */
export default function ThermalReceipt({ children, backHref, invoiceHref, label }: {
  children: React.ReactNode; backHref: string; invoiceHref?: string; label: string;
}) {
  const [paper, setPaper] = useState<"58" | "80">("80");
  const [pageHeight, setPageHeight] = useState(200);
  const [printing, setPrinting] = useState(false);
  const sheet = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kanton.receipt.paper.v1");
      if (saved === "58" || saved === "80") setPaper(saved);
    } catch { /* Printing also works when browser storage is unavailable. */ }
  }, []);

  useEffect(() => {
    const measure = () => {
      if (sheet.current) setPageHeight(Math.max(60, Math.ceil(sheet.current.scrollHeight * 25.4 / 96) + 4));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (sheet.current) observer.observe(sheet.current);
    window.addEventListener("beforeprint", measure);
    return () => { observer.disconnect(); window.removeEventListener("beforeprint", measure); };
  }, [paper]);

  async function print() {
    setPrinting(true);
    try {
      // The receipt uses system fonts, so network font loading cannot hold up printing.
      await Promise.all(Array.from(sheet.current?.querySelectorAll("img") ?? []).map(async (img) => {
        try { await img.decode(); } catch { /* Text remains printable if the logo cannot load. */ }
      }));
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      window.print();
    } finally { setPrinting(false); }
  }

  return (
    <main className="receipt-page" data-paper={paper}>
      <style>{`@media print { @page thermal-receipt { size: ${paper}mm ${pageHeight}mm; margin: 0; } }`}</style>
      <div className="receipt-toolbar noprint">
        <div className="row">
          <Link className="btn ghost sm" href={backHref}>Back</Link>
          <label className="receipt-paper">Receipt paper
            <select value={paper} onChange={(event) => {
              const width = event.target.value === "58" ? "58" : "80";
              setPaper(width);
              try { localStorage.setItem("kanton.receipt.paper.v1", width); } catch { /* Optional preference. */ }
            }}>
              <option value="80">80 mm</option><option value="58">58 mm</option>
            </select>
          </label>
          <button type="button" className="btn" onClick={print} disabled={printing}>
            {printing ? "Preparing print" : label}
          </button>
          {invoiceHref && <Link className="btn ghost" href={invoiceHref}>See the full invoice</Link>}
        </div>
        <p className="small muted">Select your thermal printer and the matching paper width. Use 100% scale, no margins,
          and turn off browser headers and footers.</p>
      </div>
      <article className="receipt-sheet" ref={sheet}>{children}</article>
    </main>
  );
}
