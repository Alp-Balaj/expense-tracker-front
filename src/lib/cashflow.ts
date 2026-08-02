import type { CashflowPoint } from "@/Models/Cashflow";

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
