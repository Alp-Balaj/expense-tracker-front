import * as React from "react";
import { Check, Pencil, Undo2 } from "lucide-react";

import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { currencySymbol } from "@/lib/identity";
import { allocateShares, formatPotAmount, toCents } from "@/lib/potMoney";
import { cn } from "@/lib/utils";
import type { PotMember, PotExpenseShareInput } from "@/Models/Pot";

export interface PotAttributionFieldProps {
  /** Active members, in the order the server returned them — which is join order. */
  members: PotMember[];
  /** The gross bill, from the AmountField above. */
  amount: number;
  currencyCode: string;
  onChange: (shares: PotExpenseShareInput[]) => void;
  /**
   * Told whenever the picker starts or stops being able to produce a valid
   * split, with the sentence explaining why when it cannot. The form has no
   * other submit guard.
   */
  onValidityChange?: (usable: boolean, problem: string | null) => void;
}

/** Digits with at most one decimal separator, max 2 decimals. */
const SHARE_RE = /^\d*(?:[.,]\d{0,2})?$/;

const parse = (raw: string): number => {
  const n = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Who an expense was for.
 *
 * <h3>Everyone, until you say otherwise</h3>
 * Every member starts selected and every slice is `total ÷ n`. If nobody ever
 * touches this block, the split is even and the pot behaves exactly like the
 * zero-accounting wallet it was before attribution existed — the charter's
 * "common path", preserved as the default rather than as an option.
 *
 * <h3>Tap a name to drop them, tap the pencil to pin an amount</h3>
 * Two different gestures because they are two different intentions. Dropping
 * somebody says the expense was not theirs; pinning says it was, for exactly
 * this much. Pinned amounts hold still and the remainder redistributes live
 * across everybody else — which is the behaviour the charter specifies, and
 * which is only legible if you can watch it happen.
 *
 * <h3>The preview is the real allocation</h3>
 * The slices shown here come from the same largest-remainder arithmetic in
 * integer cents that the server uses, over the same join-ordered member list.
 * They are a preview in the sense that the server recomputes them and is
 * authoritative — not in the sense that they are approximate. A number that
 * changed when you pressed save would undermine the one thing this screen is
 * for.
 */
export function PotAttributionField({
  members,
  amount,
  currencyCode,
  onChange,
  onValidityChange,
}: PotAttributionFieldProps) {
  // Selection and pinned amounts are the user's stable intent; `amount` is what
  // moves while they are still typing it. So those are held here and the
  // slices are re-derived, rather than the other way round.
  const [excluded, setExcluded] = React.useState<Set<string>>(new Set());
  const [pinned, setPinned] = React.useState<Record<string, string>>({});

  const participants = React.useMemo(
    () => members.filter((m) => !excluded.has(m.id)),
    [members, excluded],
  );

  const { shares, error } = React.useMemo(
    () =>
      allocateShares(
        toCents(amount),
        participants.map((m) => (m.id in pinned ? toCents(parse(pinned[m.id])) : null)),
      ),
    [amount, participants, pinned],
  );

  // A pinned field that is empty is mid-edit rather than wrong; the split it
  // would produce is not sent, and the form is told so.
  const midEdit = participants.some((m) => m.id in pinned && pinned[m.id].trim() === "");
  const problem = midEdit ? "Finish typing the amounts you pinned." : error;
  const usable = participants.length > 0 && problem === null;

  React.useEffect(() => {
    onValidityChange?.(usable, problem);

    if (!usable) return;

    onChange(
      participants.map((m, i) => ({
        membershipId: m.id,
        // Only pinned slices are sent as amounts. The rest go as null so the
        // server divides the remainder itself — sending the previewed number
        // would freeze an allocation that should follow the total.
        amount: m.id in pinned ? shares[i] / 100 : null,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usable, problem, participants, pinned, shares]);

  const toggle = (id: string) => {
    setExcluded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    // Dropping somebody drops their pinned amount with them; it would otherwise
    // come back the moment they were re-selected, which nobody would expect.
    setPinned((previous) => {
      const { [id]: _removed, ...rest } = previous;
      return rest;
    });
  };

  const pin = (id: string, currentShare: number) =>
    setPinned((previous) => ({ ...previous, [id]: (currentShare / 100).toFixed(2) }));

  const unpin = (id: string) =>
    setPinned((previous) => {
      const { [id]: _removed, ...rest } = previous;
      return rest;
    });

  const symbol = currencySymbol(currencyCode);
  const everyone = excluded.size === 0 && Object.keys(pinned).length === 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <Label className="text-sm font-medium">Who was this for?</Label>
        <span className="text-xs text-muted-foreground">
          {everyone
            ? "Everyone, split evenly"
            : `${participants.length} of ${members.length}`}
        </span>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {members.map((member) => {
          const index = participants.findIndex((p) => p.id === member.id);
          const isIn = index >= 0;
          const isPinned = member.id in pinned;
          const slice = isIn && shares.length > index ? shares[index] : 0;

          return (
            <li key={member.id} className="flex items-center gap-2 p-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={isIn}
                onClick={() => toggle(member.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    isIn
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {isIn && <Check className="h-3.5 w-3.5" />}
                </span>

                <span
                  className={cn(
                    "truncate text-sm",
                    isIn ? "text-foreground" : "text-muted-foreground line-through",
                  )}
                >
                  {member.displayName}
                  {member.isYou && (
                    <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                  )}
                </span>
              </button>

              {isIn &&
                (isPinned ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {symbol}
                      </span>
                      <Input
                        aria-label={`${member.displayName}'s share`}
                        value={pinned[member.id]}
                        inputMode="decimal"
                        onChange={(e) => {
                          const next = e.target.value.trim();
                          if (!SHARE_RE.test(next)) return;
                          setPinned((previous) => ({ ...previous, [member.id]: next }));
                        }}
                        className="h-9 w-24 pl-7 text-right"
                        autoFocus
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={`Split ${member.displayName}'s share evenly again`}
                      onClick={() => unpin(member.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Undo2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label={`Type an exact amount for ${member.displayName}`}
                    onClick={() => pin(member.id, slice)}
                    className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm tabular-nums text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {formatPotAmount(slice / 100, currencyCode)}
                    <Pencil aria-hidden className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
            </li>
          );
        })}
      </ul>

      {/* One message per state, and it is the server's own sentence — including
          for an empty picker, which the allocator answers rather than this
          component. Two wordings for one refusal is how a form and its endpoint
          start disagreeing about what is wrong. */}
      {problem ? (
        <p role="alert" className="text-xs text-destructive">
          {problem}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Tap a name to leave them out, or tap an amount to type an exact one — the rest
          share what is left.
        </p>
      )}
    </div>
  );
}
