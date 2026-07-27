import { AmountType } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { Expense } from "@/Models/Expense";
import type { FutureExpense } from "@/Models/FutureExpense";
import { monthKey, toISODate, todayISO } from "@/lib/dates";

/**
 * Everything the dashboard shows that the API does not return directly:
 * the month cursor behind "safe to spend", the spend heatmap, the cash
 * runway, and the recurring charges inferred from expense history.
 *
 * All of it is pure and takes `today` as an argument so the tests can pin a
 * date. Expense and income amounts are treated as already being in the user's
 * base currency — the same assumption the rest of the app makes. Account
 * balances carry their own `currencyCode` and are converted by the caller.
 */

// #region ── Date helpers ─────────────────────────────────────────────

function toDate(value: string): Date {
  const [year, month, day] = toISODate(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Shifts a "yyyy-MM-dd" value by whole days, staying in local time. */
export function addDaysISO(value: string, days: number): string {
  const d = toDate(value);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole days from `from` to `to`; negative when `to` is in the past. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000);
}

/** Days in the month behind a "yyyy-MM" key. */
export function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

export type MonthCursor = {
  month: string;
  daysInMonth: number;
  /** 1-based day the month has reached — the whole month once it is past. */
  dayReached: number;
  /** Days you can still spend on, today included. */
  daysLeft: number;
  /** 0..1, where the pace marker sits on the budget bar. */
  elapsed: number;
};

/** Where a month stands relative to today. */
export function monthCursor(month: string, today: string = todayISO()): MonthCursor {
  const total = daysInMonth(month);
  const current = monthKey(today);

  let dayReached: number;
  let daysLeft: number;
  if (month < current) {
    dayReached = total;
    daysLeft = 0;
  } else if (month > current) {
    dayReached = 0;
    daysLeft = total;
  } else {
    dayReached = Number(toISODate(today).slice(8, 10));
    daysLeft = total - dayReached + 1;
  }

  return { month, daysInMonth: total, dayReached, daysLeft, elapsed: dayReached / total };
}

// #endregion

// #region ── Spend calendar ───────────────────────────────────────────

export type CalendarCell =
  | { kind: "blank"; key: string }
  | {
      kind: "day";
      key: string;
      day: number;
      date: string;
      amount: number;
      /** 0 = nothing logged, 1–4 = quartile of the month's busiest day. */
      level: 0 | 1 | 2 | 3 | 4;
      isToday: boolean;
      isFuture: boolean;
    };

export type SpendCalendar = {
  /** Monday-first, padded with leading blanks so the columns line up. */
  cells: CalendarCell[];
  /** The busiest day's spend. */
  max: number;
  /** Where the darkest band starts — the top of the legend. */
  scaleTop: number;
  /** Days already reached that have at least one expense. */
  spentDays: number;
  /** Days already reached with nothing logged. */
  quietDays: number;
  busiestDay: number | null;
};

/** The value `fraction` of the way through a sorted list. */
function quantile(sorted: number[], fraction: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(fraction * sorted.length)));
  return sorted[index];
}

/** Spend per day for one month, bucketed into five intensity levels. */
export function buildSpendCalendar(
  expenses: Expense[],
  month: string,
  today: string = todayISO(),
): SpendCalendar {
  const total = daysInMonth(month);
  const cursor = monthCursor(month, today);
  const todayKey = toISODate(today);

  const perDay = new Array<number>(total + 1).fill(0);
  for (const expense of expenses) {
    const date = toISODate(expense.date);
    if (date.slice(0, 7) !== month) continue;
    const day = Number(date.slice(8, 10));
    if (day >= 1 && day <= total) perDay[day] += expense.amount;
  }

  let max = 0;
  let busiestDay: number | null = null;
  for (let day = 1; day <= total; day += 1) {
    if (perDay[day] > max) {
      max = perDay[day];
      busiestDay = day;
    }
  }

  // Bands come from the quartiles of the days that actually saw spending, not
  // from the month's maximum: one rent payment would otherwise flatten every
  // other day into the palest band.
  const spending = perDay.slice(1).filter((amount) => amount > 0).sort((a, b) => a - b);
  const bands = [quantile(spending, 0.25), quantile(spending, 0.5), quantile(spending, 0.75)];

  const [year, monthNumber] = month.split("-").map(Number);
  // getDay() is Sunday-first; the grid is Monday-first.
  const leadingBlanks = (new Date(year, monthNumber - 1, 1).getDay() + 6) % 7;

  const cells: CalendarCell[] = [];
  for (let i = 0; i < leadingBlanks; i += 1) {
    cells.push({ kind: "blank", key: `blank-${i}` });
  }

  let spentDays = 0;
  let quietDays = 0;
  for (let day = 1; day <= total; day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    const amount = perDay[day];
    const isFuture = date > todayKey;

    if (!isFuture) {
      if (amount > 0) spentDays += 1;
      else quietDays += 1;
    }

    const level =
      amount <= 0
        ? 0
        : ((1 + bands.filter((band) => amount >= band).length) as 1 | 2 | 3 | 4);

    cells.push({
      kind: "day",
      key: date,
      day,
      date,
      amount,
      level,
      isToday: date === todayKey && month === cursor.month,
      isFuture,
    });
  }

  return { cells, max, scaleTop: bands[2], spentDays, quietDays, busiestDay };
}

// #endregion

// #region ── Liquidity and runway ─────────────────────────────────────

/** Accounts you can actually spend from — credit and investments excluded. */
const LIQUID_TYPES: readonly AmountType[] = [
  AmountType.CheckingAccount,
  AmountType.SavingsAccount,
  AmountType.Cash,
];

export type LiquidPosition = {
  /** Converted into the user's base currency. */
  total: number;
  liquidCount: number;
  accountCount: number;
};

export function liquidPosition(
  accounts: Account[],
  convert: (amount: number, fromCode: string) => number,
): LiquidPosition {
  const liquid = accounts.filter((a) => LIQUID_TYPES.includes(a.amountType));
  return {
    total: liquid.reduce((sum, a) => sum + convert(a.balance ?? 0, a.currencyCode), 0),
    liquidCount: liquid.length,
    accountCount: accounts.length,
  };
}

/**
 * Average spend per day over the trailing window. Short histories divide by
 * the days actually covered, so a week-old account does not read as a burn
 * rate seven times lower than it is.
 */
export function dailyBurn(
  expenses: Expense[],
  today: string = todayISO(),
  windowDays = 90,
): number {
  const start = addDaysISO(today, -(windowDays - 1));
  const todayKey = toISODate(today);

  let sum = 0;
  let earliest: string | null = null;
  for (const expense of expenses) {
    const date = toISODate(expense.date);
    if (date < start || date > todayKey) continue;
    sum += expense.amount;
    if (earliest === null || date < earliest) earliest = date;
  }

  if (sum <= 0 || earliest === null) return 0;
  const covered = Math.min(windowDays, Math.max(1, daysBetween(earliest, todayKey) + 1));
  return sum / covered;
}

/** How long the liquid balance lasts at the current burn. Null when unknowable. */
export function cashRunwayDays(liquid: number, burn: number): number | null {
  if (burn <= 0 || liquid <= 0) return null;
  return Math.floor(liquid / burn);
}

// #endregion

// #region ── Upcoming bills ───────────────────────────────────────────

export type UpcomingBill = FutureExpense & { daysUntil: number };

/** Planned expenses, soonest first, with overdue ones leading. */
export function upcomingBills(
  futureExpenses: FutureExpense[],
  today: string = todayISO(),
): UpcomingBill[] {
  return futureExpenses
    .map((bill) => ({ ...bill, daysUntil: daysBetween(today, toISODate(bill.date)) }))
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/** What the bills due within `days` add up to — the "€1,591 by 10 Aug" line. */
export function billsDueWithin(bills: UpcomingBill[], days: number): number {
  return bills
    .filter((bill) => bill.daysUntil <= days)
    .reduce((sum, bill) => sum + bill.amount, 0);
}

// #endregion

// #region ── Recurring charges ────────────────────────────────────────

export type RecurringCharge = {
  key: string;
  name: string;
  /** The typical charge — the median, so one odd month does not skew it. */
  amount: number;
  lastDate: string;
  nextDate: string;
  occurrences: number;
  /** Median days between charges. */
  cadenceDays: number;
};

const MIN_OCCURRENCES = 3;
const MIN_CADENCE_DAYS = 24;
const MAX_CADENCE_DAYS = 38;
/** How far a single charge may sit from the median and still count as the same subscription. */
const AMOUNT_TOLERANCE = 0.4;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Charges that repeat on a roughly monthly cadence — same title, at least
 * three times across three different months, with amounts that stay close to
 * each other. Nothing on the backend marks an expense as a subscription, so
 * this is inferred from history.
 */
export function detectRecurring(
  expenses: Expense[],
  today: string = todayISO(),
  lookbackMonths = 6,
): RecurringCharge[] {
  const start = toISODate(
    new Date(toDate(today).getFullYear(), toDate(today).getMonth() - lookbackMonths, 1),
  );
  const todayKey = toISODate(today);

  const groups = new Map<string, { name: string; dates: string[]; amounts: number[] }>();
  for (const expense of expenses) {
    const name = (expense.title ?? "").trim();
    if (!name) continue;
    const date = toISODate(expense.date);
    if (date < start || date > todayKey) continue;

    const key = name.toLowerCase();
    const group = groups.get(key) ?? { name, dates: [], amounts: [] };
    group.dates.push(date);
    group.amounts.push(expense.amount);
    groups.set(key, group);
  }

  const charges: RecurringCharge[] = [];
  for (const [key, group] of groups) {
    if (group.dates.length < MIN_OCCURRENCES) continue;

    const dates = [...group.dates].sort();
    const months = new Set(dates.map((d) => d.slice(0, 7)));
    if (months.size < MIN_OCCURRENCES) continue;

    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i += 1) gaps.push(daysBetween(dates[i - 1], dates[i]));
    const cadence = median(gaps);
    if (cadence < MIN_CADENCE_DAYS || cadence > MAX_CADENCE_DAYS) continue;

    const typical = median(group.amounts);
    if (typical <= 0) continue;
    const consistent = group.amounts.every(
      (amount) => Math.abs(amount - typical) <= typical * AMOUNT_TOLERANCE,
    );
    if (!consistent) continue;

    const lastDate = dates[dates.length - 1];
    let nextDate = addDaysISO(lastDate, Math.round(cadence));
    while (nextDate < todayKey) nextDate = addDaysISO(nextDate, Math.round(cadence));

    charges.push({
      key,
      name: group.name,
      amount: typical,
      lastDate,
      nextDate,
      occurrences: dates.length,
      cadenceDays: Math.round(cadence),
    });
  }

  return charges.sort((a, b) => a.nextDate.localeCompare(b.nextDate) || b.amount - a.amount);
}

/** What the detected subscriptions cost per month. */
export function recurringMonthlyTotal(charges: RecurringCharge[]): number {
  return charges.reduce((sum, charge) => sum + charge.amount, 0);
}

// #endregion

// #region ── Presentation helpers ─────────────────────────────────────

/**
 * Splits a formatted amount so the cents can be dimmed: "€1.234,56" becomes
 * lead "€1.234", fraction ",56", trail "". Locale-agnostic — the currency
 * symbol stays with whichever side it was on.
 */
export function splitAmountParts(formatted: string): {
  lead: string;
  fraction: string;
  trail: string;
} {
  const match = /([.,]\d{1,2})(\D*)$/.exec(formatted);
  if (!match) return { lead: formatted, fraction: "", trail: "" };
  return { lead: formatted.slice(0, match.index), fraction: match[1], trail: match[2] };
}

/** "Good morning" / "Good afternoon" / "Good evening" for the greeting line. */
export function greeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// #endregion
