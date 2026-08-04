import { currencySymbol } from "@/lib/identity";

/**
 * Money helpers for the pot screens.
 *
 * **Nothing here converts anything.** Every amount inside a pot is in the pot's
 * own currency, so the only job of this file is to divide it and to print it.
 * The personal side — budgets, category totals — does convert, through each
 * member's own rates, and that happens on the server where the rates live.
 */

/** An amount in whole cents. Rounds half away from zero, as the server does. */
export const toCents = (amount: number): number =>
  Math.round(Math.abs(amount) * 100) * Math.sign(amount || 1);

export const fromCents = (cents: number): number => cents / 100;

/**
 * `€1,234.50`. Always two decimals: a pot's whole promise is that the parts add
 * up to the whole, and a figure that hides its cents cannot be checked by eye.
 */
export function formatPotAmount(amount: number, currencyCode: string): string {
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${amount < 0 ? "−" : ""}${currencySymbol(currencyCode)}${formatted}`;
}

/** `+€12.40` / `−€3.20` / `€0.00`, for a figure whose sign is the point. */
export function formatPosition(amount: number, currencyCode: string): string {
  if (amount === 0) return formatPotAmount(0, currencyCode);
  return `${amount > 0 ? "+" : ""}${formatPotAmount(amount, currencyCode)}`;
}

/**
 * Splits `totalCents` evenly across `count` slots, leftover cents to the
 * earliest slots.
 *
 * A deliberate mirror of the server's `ShareAllocator.Even` — largest
 * remainder, integer cents, tie-broken by the caller's order. The server is
 * authoritative and re-allocates everything it is sent; this exists so the
 * picker can show each person's slice *while you are typing*, which is the
 * whole affordance. Both must agree, or the number under somebody's name
 * changes when you press save — so the members array passed in is the one the
 * server ordered by join time, and not one this screen sorted itself.
 */
export function allocateEven(totalCents: number, count: number): number[] {
  if (count < 1) return [];
  if (totalCents < 0) return Array<number>(count).fill(0);

  const each = Math.floor(totalCents / count);
  const leftover = totalCents - each * count;

  return Array.from({ length: count }, (_, i) => each + (i < leftover ? 1 : 0));
}

/**
 * The general case the four entry affordances all reduce to: some slots carry
 * an amount the user typed, the rest divide what is left.
 *
 * Mirrors `ShareAllocator.Allocate`. Returns the preview and, when the typed
 * amounts cannot be reconciled with the total, the same sentence the server
 * would answer with — so the form can refuse before the round trip and say the
 * same thing either way.
 */
export function allocateShares(
  totalCents: number,
  fixedCents: (number | null)[],
): { shares: number[]; error: string | null } {
  if (fixedCents.length === 0)
    return { shares: [], error: "Say who this expense was for." };

  if (fixedCents.some((c) => c !== null && c < 0))
    return { shares: [], error: "A share cannot be negative." };

  const fixedTotal = fixedCents.reduce<number>((sum, c) => sum + (c ?? 0), 0);
  const open = fixedCents.filter((c) => c === null).length;

  if (fixedTotal > totalCents)
    return { shares: [], error: "Those shares add up to more than the expense." };

  if (open === 0) {
    if (fixedTotal !== totalCents)
      return { shares: [], error: "Those shares have to add up to the expense." };

    return { shares: fixedCents.map((c) => c as number), error: null };
  }

  const even = allocateEven(totalCents - fixedTotal, open);
  let next = 0;

  return {
    shares: fixedCents.map((c) => (c === null ? even[next++] : c)),
    error: null,
  };
}
