"use client";

export default function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button className="btn noprint" onClick={() => window.print()}>
      {label}
    </button>
  );
}
