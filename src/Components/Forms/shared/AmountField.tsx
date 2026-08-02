import * as React from "react";

import { cn } from "@/lib/utils";

/** "EUR" -> "€"; falls back to the code itself (or €) when Intl can't help. */
export function currencySymbol(code?: string | null): string {
  if (!code) return "€";
  try {
    const part = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((p) => p.type === "currency");
    return part?.value ?? code;
  } catch {
    return code;
  }
}

export interface AmountFieldProps {
  value: number;
  onChange: (value: number) => void;
  currencySymbol?: string;
  label?: string;
  autoFocus?: boolean;
  id?: string;
}

/** Digits with at most one decimal separator (comma or dot), max 2 decimals. */
const AMOUNT_RE = /^\d*(?:[.,]\d{0,2})?$/;

const parse = (raw: string): number => {
  const n = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Hero amount entry: a big, centered value with the currency symbol, the way
 * money-first mobile apps do it. Uses inputmode="decimal" so phones open the
 * numeric keypad, keeps a raw string internally so "24," and "24.5" are
 * typeable, and reports a parsed number upward on every change.
 */
export function AmountField({
  value,
  onChange,
  currencySymbol: symbol = "€",
  label = "Amount",
  autoFocus,
  id = "amount",
}: AmountFieldProps) {
  const [raw, setRaw] = React.useState(value > 0 ? String(value) : "");

  // Adopt external resets (form re-opened / row switched), but never fight
  // the user mid-keystroke: only resync when the parsed values disagree.
  React.useEffect(() => {
    if (parse(raw) !== value) setRaw(value > 0 ? String(value) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value.trim();
    if (!AMOUNT_RE.test(next)) return;
    setRaw(next);
    onChange(parse(next));
  };

  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <label
        htmlFor={id}
        className="text-xs font-medium tracking-wider text-muted-foreground uppercase"
      >
        {label}
      </label>
      <div className="flex w-full items-baseline justify-center gap-1">
        <span className="text-2xl font-semibold text-muted-foreground">
          {symbol}
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          value={raw}
          onChange={handleChange}
          onFocus={(e) => e.target.select()}
          placeholder="0.00"
          size={Math.max(raw.length, 4)}
          className={cn(
            "min-w-0 max-w-full border-none bg-transparent p-0 text-center",
            "text-5xl font-bold tabular-nums text-foreground caret-primary",
            "placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0"
          )}
        />
      </div>
    </div>
  );
}
