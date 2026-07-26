import { format, parseISO } from "date-fns";

/**
 * Date-only values (transaction dates, deadlines) travel as plain
 * "yyyy-MM-dd" strings between the backend (DateOnly) and the UI.
 * Never round-trip them through Date + toISOString(): local midnight
 * serialized as UTC lands on the previous day in UTC+ timezones.
 */

/** Today as "yyyy-MM-dd" in the user's local timezone. */
export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Normalizes a backend value ("yyyy-MM-dd", a full ISO datetime from
 * pre-migration data, or a Date) to "yyyy-MM-dd". Falls back to today
 * for missing/invalid input.
 */
export function toISODate(value: unknown): string {
  if (value instanceof Date && !isNaN(value.getTime())) {
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${mm}-${dd}`;
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return todayISO();
}

/** Formats a date-only value for display (defaults to "dd.MM.yyyy"). */
export function formatDate(value: unknown, fmt = "dd.MM.yyyy"): string {
  if (value == null || value === "") return "";
  return format(parseISO(toISODate(value)), fmt);
}

/** "yyyy-MM" bucket key, derived from the string — no timezone math. */
export function monthKey(value: unknown): string {
  return toISODate(value).slice(0, 7);
}

/** monthKey for an offset relative to the current local month (0 = this month). */
export function monthKeyFromNow(monthsAgo: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
