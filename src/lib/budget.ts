import type { BudgetStatus } from "@/Models/Budget";

/**
 * How close a budget is to its limit. The thresholds are the contract the
 * progress bars, dashboard widget and report all share: at or under 80% is
 * healthy, above 80% warns, above 100% is overspent.
 */
export type BudgetTone = "under" | "warning" | "over";

export const BUDGET_WARNING_THRESHOLD = 80;

export function budgetTone(percentUsed: number): BudgetTone {
  if (percentUsed > 100) return "over";
  if (percentUsed > BUDGET_WARNING_THRESHOLD) return "warning";
  return "under";
}

/** Tailwind classes per tone, so every budget surface reads the same. */
export const budgetToneClasses: Record<
  BudgetTone,
  { bar: string; text: string; badge: string; ring: string }
> = {
  under: {
    bar: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
    badge: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
    ring: "border-green-500/50",
  },
  warning: {
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    ring: "border-amber-500/50",
  },
  over: {
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    badge: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    ring: "border-red-500/50",
  },
};

/** Width of the filled part of a progress bar: the raw percentage, clamped. */
export function barWidth(percentUsed: number): number {
  if (!Number.isFinite(percentUsed) || percentUsed < 0) return 0;
  return Math.min(percentUsed, 100);
}

/** Amount overspent, or 0 while still within the limit. */
export function overspend(status: Pick<BudgetStatus, "remaining">): number {
  return status.remaining < 0 ? Math.abs(status.remaining) : 0;
}

/**
 * Budgets closest to (or past) their limit first — what the dashboard widget
 * surfaces. The overall budget is normally excluded: it tracks the same spend
 * as the category budgets and would crowd out the category that actually needs
 * attention. When it is the *only* budget, it is shown rather than nothing.
 */
export function budgetsNeedingAttention(
  statuses: BudgetStatus[],
  limit = 3
): BudgetStatus[] {
  const byCategory = statuses.filter((s) => s.categoryId !== null);
  const ranked = byCategory.length > 0 ? byCategory : statuses;

  return [...ranked]
    .sort((a, b) => b.percentUsed - a.percentUsed)
    .slice(0, limit);
}

/** The current local month as "yyyy-MM". */
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Shifts a "yyyy-MM" value by whole months, with no timezone math. */
export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(year, monthNumber - 1 + delta, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-07" -> "July 2026", in the viewer's locale. */
export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) return month;
  return new Date(year, monthNumber - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}
