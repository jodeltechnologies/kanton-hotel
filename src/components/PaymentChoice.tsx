"use client";

import type { PaymentMode } from "@/lib/payment";
import { fcfa } from "@/lib/util";

export default function PaymentChoice({ mode, onChange, advance, total, advancePercent }: {
  mode: PaymentMode; onChange: (mode: PaymentMode) => void;
  advance: number; total: number; advancePercent: number;
}) {
  return (
    <fieldset className="payment-choice">
      <legend>Reserve or pay in full</legend>
      <label className={"payment-option" + (mode === "reserve" ? " selected" : "")}>
        <input type="radio" name="paymentMode" value="reserve" checked={mode === "reserve"}
          onChange={() => onChange("reserve")} />
        <span><b>Reserve with an advance</b><small>{advancePercent}% now: {fcfa(advance)}. Balance on arrival.</small></span>
      </label>
      <label className={"payment-option" + (mode === "full" ? " selected" : "")}>
        <input type="radio" name="paymentMode" value="full" checked={mode === "full"}
          onChange={() => onChange("full")} />
        <span><b>Pay in full</b><small>{fcfa(total)} now. No balance after reception confirms payment.</small></span>
      </label>
    </fieldset>
  );
}
