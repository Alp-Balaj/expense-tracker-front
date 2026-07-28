import { monthKey, toISODate, todayISO } from "@/lib/dates";
import { shiftMonth } from "@/lib/budget";

/**
 * The date window the expense and income pages are looking at.
 *
 * A period is always a resolved, inclusive pair of "yyyy-MM-dd" strings, so
 * every consumer filters by plain string comparison — the same timezone-free
 * discipline `lib/dates` established (Fix-14). Nothing here builds a Date to
 * compare with; local midnight through toISOString() lands on the previous
 * day in UTC+ timezones.
 *
 * Pure and `today`-injectable throughout so the tests can pin a date.
 */

export type PeriodPreset =
  | "thisMonth"
  | "lastMonth"
  | "last3Months"
  | "thisYear"
  | "all"
  | "custom";

export type Period = {
  preset: PeriodPreset;
  /** Inclusive lower bound, "yyyy-MM-dd". */
  from: string;
  /** Inclusive upper bound, "yyyy-MM-dd". */
  to: string;
};

/** Wide enough to contain any real transaction date, so "All time" needs no special case downstream. */
export const MIN_DATE = "0000-01-01";
export const MAX_DATE = "9999-12-31";

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "last3Months", label: "Last 3 months" },
  { value: "thisYear", label: "This year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
];

/** Days in the month behind a "yyyy-MM" key. Day 0 of the next month is the last of this one. */
function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

/** First day of a "yyyy-MM" month, as "yyyy-MM-dd". */
export function monthStart(month: string): string {
  return `${month}-01`;
}

/** Last day of a "yyyy-MM" month, as "yyyy-MM-dd". */
export function monthEnd(month: string): string {
  return `${month}-${String(daysInMonth(month)).padStart(2, "0")}`;
}

/**
 * Turns a preset into concrete bounds. `custom` needs `range`; without it (a
 * stored custom period whose dates were lost) it degrades to the current month
 * rather than throwing. Reversed custom ranges are swapped, so dragging the
 * end date before the start cannot silently select nothing.
 */
export function resolvePeriod(
  preset: PeriodPreset,
  today: string = todayISO(),
  range?: { from: string; to: string },
): Period {
  const thisMonth = monthKey(today);

  switch (preset) {
    case "thisMonth":
      return { preset, from: monthStart(thisMonth), to: monthEnd(thisMonth) };

    case "lastMonth": {
      const previous = shiftMonth(thisMonth, -1);
      return { preset, from: monthStart(previous), to: monthEnd(previous) };
    }

    // Three calendar months counting the current one — "last 3 months" in
    // May means March, April and May, not a rolling 90 days.
    case "last3Months":
      return {
        preset,
        from: monthStart(shiftMonth(thisMonth, -2)),
        to: monthEnd(thisMonth),
      };

    case "thisYear": {
      const year = toISODate(today).slice(0, 4);
      return { preset, from: `${year}-01-01`, to: `${year}-12-31` };
    }

    case "all":
      return { preset, from: MIN_DATE, to: MAX_DATE };

    case "custom": {
      if (!range) return resolvePeriod("thisMonth", today);
      const from = toISODate(range.from);
      const to = toISODate(range.to);
      return from <= to
        ? { preset, from, to }
        : { preset, from: to, to: from };
    }
  }
}

export const DEFAULT_PERIOD_PRESET: PeriodPreset = "thisMonth";

/** Is a date-only value inside the period? Both bounds inclusive. */
export function isWithinPeriod(value: unknown, period: Period): boolean {
  const date = toISODate(value);
  return date >= period.from && date <= period.to;
}

/** The rows of a dated list that fall inside the period. */
export function filterByPeriod<T extends { date: string }>(
  rows: T[],
  period: Period,
): T[] {
  if (period.from === MIN_DATE && period.to === MAX_DATE) return rows;
  return rows.filter((row) => isWithinPeriod(row.date, period));
}

/**
 * The equal-length window immediately before this one — what the summary
 * cards compare against, so "Last month" is measured against the month before
 * it rather than against a fixed "previous calendar month".
 *
 * Calendar presets step by whole months so the comparison stays month-shaped
 * (a 31-day January compares against a 28-day February, not against 31 days
 * ending mid-February). Custom ranges step back by their own day count.
 * "All time" has nothing before it.
 */
export function precedingPeriod(period: Period): Period | null {
  switch (period.preset) {
    case "all":
      return null;

    case "thisMonth":
    case "lastMonth": {
      const previous = shiftMonth(monthKey(period.from), -1);
      return {
        preset: period.preset,
        from: monthStart(previous),
        to: monthEnd(previous),
      };
    }

    case "last3Months": {
      const start = shiftMonth(monthKey(period.from), -3);
      const end = shiftMonth(monthKey(period.to), -3);
      return { preset: period.preset, from: monthStart(start), to: monthEnd(end) };
    }

    case "thisYear": {
      const year = Number(period.from.slice(0, 4)) - 1;
      return { preset: period.preset, from: `${year}-01-01`, to: `${year}-12-31` };
    }

    case "custom": {
      const span = daysBetweenISO(period.from, period.to); // inclusive length - 1
      return {
        preset: period.preset,
        from: addDaysISO(period.from, -(span + 1)),
        to: addDaysISO(period.from, -1),
      };
    }
  }
}

/** Whole days from `from` to `to`, both "yyyy-MM-dd". */
function daysBetweenISO(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const start = new Date(fy, fm - 1, fd).getTime();
  const end = new Date(ty, tm - 1, td).getTime();
  return Math.round((end - start) / 86_400_000);
}

/** Shifts a "yyyy-MM-dd" value by whole days, staying in local time. */
function addDaysISO(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const d = new Date(year, month - 1, day + days);
  return toISODate(d);
}

/** How many calendar months the period touches. At least 1. */
export function monthSpan(period: Period): number {
  if (period.from === MIN_DATE || period.to === MAX_DATE) return Infinity;

  const [fromYear, fromMonth] = period.from.split("-").map(Number);
  const [toYear, toMonth] = period.to.split("-").map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
}

/**
 * The buckets a trend chart should show for this period, oldest first.
 *
 * A trend needs history around the selection to be readable, so a one-month
 * period still charts the six months *ending* at it — picking "Last month"
 * slides the whole window back rather than collapsing it to a single point.
 * Longer periods widen up to `maxMonths`. The window never runs past the
 * current month: charting empty future buckets just squashes the real data.
 */
export function trendMonths(
  period: Period,
  today: string = todayISO(),
  minMonths = 6,
  maxMonths = 12,
): string[] {
  const thisMonth = monthKey(today);
  const periodEnd = period.to === MAX_DATE ? thisMonth : monthKey(period.to);
  const end = periodEnd > thisMonth ? thisMonth : periodEnd;

  const span = monthSpan(period);
  const count = Math.max(minMonths, Math.min(span, maxMonths));

  const months: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) months.push(shiftMonth(end, -i));
  return months;
}

/** Human label for the period, used in card subtitles and chart descriptions. */
export function periodLabel(period: Period): string {
  const preset = PERIOD_PRESETS.find((p) => p.value === period.preset);
  if (period.preset === "custom") {
    return `${period.from} → ${period.to}`;
  }
  return preset?.label ?? "This month";
}
