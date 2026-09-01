import type { CashflowPoint, CashflowProjection } from "@/Models/Cashflow";

/**
 * The projection's lowest day — where the month pinches. Null when there are
 * no points. Ties go to the earlier day, which is the one the user hits first.
 */
export function lowestPoint(points: CashflowPoint[]): CashflowPoint | null {
  let lowest: CashflowPoint | null = null;
  for (const point of points) {
    if (lowest === null || point.projectedBalance < lowest.projectedBalance) {
      lowest = point;
    }
  }
  return lowest;
}

/**
 * The first day the projection goes negative — the date the warning names.
 * Distinct from the lowest point: on a steadily falling line the minimum is
 * the last day, but the trouble starts at the crossing.
 */
export function firstBelowZero(points: CashflowPoint[]): CashflowPoint | null {
  return points.find((point) => point.projectedBalance < 0) ?? null;
}

/**
 * Planned spending still to come this month, in the base currency — the
 * forward half of "what will this month cost me".
 *
 * Read off the cashflow projection rather than summed from occurrences,
 * because the projection is the only place that already does all four of the
 * things this number needs: it clamps overdue bills forward to today instead
 * of dropping them, it expands templates into due dates that have no
 * occurrence row yet (nothing is materialised beyond today, so summing rows
 * alone would under-count early in the month and creep up day by day),
 * it leaves out occurrences already committed to an expense, and it converts
 * currencies. Summing it here keeps this figure and the cashflow panel's
 * headline derived from one set of numbers, so they cannot drift apart.
 *
 * Null when the projection cannot speak for `month`: it is always anchored on
 * today, so a past month the user stepped back to has no planned remainder.
 */
export function plannedRemainingThisMonth(
  projection: CashflowProjection | undefined,
  month: string,
): number | null {
  if (!projection || projection.month !== month) return null;

  return projection.points
    .filter((point) => point.date >= projection.today && point.date <= projection.endOfMonth)
    .reduce((sum, point) => sum + point.plannedOutflow, 0);
}
