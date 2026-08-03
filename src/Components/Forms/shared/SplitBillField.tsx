import * as React from "react";
import { Users } from "lucide-react";

import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";

export interface SplitBillFieldProps {
  /** The gross bill total — whatever the AmountField currently holds. */
  amount: number;
  /**
   * What others owe you on this expense: `amount − myShare`.
   * null/undefined means this is not a split bill.
   */
  value?: number | null;
  onChange: (expectedReimbursement: number | null) => void;
  /**
   * Told whenever the block starts or stops being able to produce a receivable.
   *
   * `onChange(null)` is ambiguous on its own — it is what a collapsed block
   * emits ("not a split", a perfectly good answer) and also what an open one
   * emits while the share is empty or too big. A form that only sees the value
   * cannot tell those apart, and would save the split away silently. This says
   * which of the two it is: false only while the block is open with a share
   * that cannot become a receivable. Called on mount and on every change.
   */
  onValidityChange?: (usable: boolean) => void;
  currencySymbol?: string;
  id?: string;
}

/** Digits with at most one decimal separator (comma or dot), max 2 decimals. */
const SHARE_RE = /^\d*(?:[.,]\d{0,2})?$/;

const parse = (raw: string): number => {
  const n = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/** Money rounding — 60 − 20.1 is 39.900000000000006 without it. */
const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * The split rule in one place: a share has to be a real slice of the bill.
 * Zero is "I paid nothing", the full amount is "not a split at all" — both
 * mean there is no receivable to record, so they emit null rather than a
 * degenerate expectedReimbursement of 0.
 */
const expectedFrom = (share: number, amount: number): number | null =>
  share > 0 && share < amount ? round2(amount - share) : null;

/**
 * Split-bill entry, sitting directly under the amount.
 *
 * <h3>Total first, share second</h3>
 * The gross stays in the AmountField because gross is what left the account —
 * a 60 dinner debits 60 whoever eventually pays their part back. What the user
 * types here is their own share, and the receivable (`amount − myShare`) is
 * derived and shown live. `myShare` itself is never sent anywhere; only the
 * derived `expectedReimbursement` leaves this component.
 *
 * <h3>Collapsed until asked for</h3>
 * Most expenses are not split, so the block costs one quiet chip of space
 * until it is opened. Opening is the whole gesture — there is no checkbox
 * state to get out of sync with the number.
 *
 * <h3>Controlled, and it survives the total changing</h3>
 * The share is the user's stable intent; the total is what moves while they
 * are still typing it. So the share is held here and the receivable is
 * re-derived whenever `amount` changes, instead of the other way round. A
 * momentarily impossible share (bigger than the total that has been typed so
 * far) reports null and says so in place, rather than collapsing the block
 * out from under a half-finished edit.
 *
 * <h3>An unusable share is not a silent "no split"</h3>
 * Because null covers both, `onValidityChange` says which one it is, and the
 * forms hold their submit shut until the block can produce a receivable. The
 * alternative — saving a plain expense with a cheerful "Expense added" — throws
 * away something the user was in the middle of saying.
 */
export function SplitBillField({
  amount,
  value,
  onChange,
  onValidityChange,
  currencySymbol: symbol = "€",
  id = "split-my-share",
}: SplitBillFieldProps) {
  const seeded = value != null && value > 0;

  const [expanded, setExpanded] = React.useState(seeded);
  const [raw, setRaw] = React.useState(() =>
    seeded ? String(round2(amount - value!)) : ""
  );

  // What this component last told the parent. Lets the effect below tell an
  // echo of our own emission apart from a genuine outside change (form reset
  // after submit, edit row switched), which is the only case worth adopting.
  const lastEmitted = React.useRef<number | null>(value ?? null);

  const emit = (next: number | null) => {
    lastEmitted.current = next;
    onChange(next);
  };

  React.useEffect(() => {
    const incoming = value ?? null;
    if (incoming === lastEmitted.current) return;
    lastEmitted.current = incoming;
    if (incoming === null) {
      setRaw("");
      setExpanded(false);
    } else {
      // Round-trip an existing split: the stored receivable becomes the share.
      setRaw(String(round2(amount - incoming)));
      setExpanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // The total moved: keep the share and re-derive the receivable from it.
  React.useEffect(() => {
    if (!expanded) return;
    const next = expectedFrom(parse(raw), amount);
    if (next !== lastEmitted.current) emit(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value.trim();
    if (!SHARE_RE.test(next)) return;
    setRaw(next);
    emit(expectedFrom(parse(next), amount));
  };

  const share = parse(raw);
  const owed = expectedFrom(share, amount);

  // Only ever a problem while the block is open. Collapsed means "not a
  // split", which is never wrong — so closing the block is always a way out.
  const problem = !expanded
    ? null
    : amount <= 0
      ? "Enter the bill total first."
      : raw === "" || share <= 0
        ? "Enter your share of the bill."
        : share >= amount
          ? "Your share has to be less than the total."
          : null;

  const usable = problem === null;

  // Reported through a ref rather than on every render: the parent turns this
  // straight into a disabled submit, and a setState per keystroke that mostly
  // sets the same boolean is a re-render nobody asked for.
  const lastUsable = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    if (lastUsable.current === usable) return;
    lastUsable.current = usable;
    onValidityChange?.(usable);
  }, [usable, onValidityChange]);

  const open = () => setExpanded(true);

  const close = () => {
    setExpanded(false);
    setRaw("");
    emit(null);
  };

  if (!expanded) {
    return (
      <div>
        <button
          type="button"
          onClick={open}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed",
            "border-border px-3.5 text-sm text-muted-foreground transition-colors",
            "hover:border-primary hover:text-primary"
          )}
        >
          <Users className="size-3.5" />
          Split bill
        </button>
      </div>
    );
  }

  const messageId = `${id}-message`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium">
          Your share
        </Label>
        <button
          type="button"
          onClick={close}
          className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          Not a split
        </button>
      </div>

      <div className="relative">
        <span
          aria-hidden
          className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
        >
          {symbol}
        </span>
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={raw}
          onChange={handleChange}
          onFocus={(e) => e.target.select()}
          placeholder="0.00"
          aria-invalid={problem !== null}
          aria-describedby={messageId}
          className="h-11 pl-8 tabular-nums"
        />
      </div>

      <p
        id={messageId}
        className={cn(
          "text-sm",
          problem ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {problem ?? (
          <>
            Owed to you{" "}
            <span className="font-medium tabular-nums text-foreground">
              {symbol}
              {(owed ?? 0).toFixed(2)}
            </span>
          </>
        )}
      </p>
    </div>
  );
}
