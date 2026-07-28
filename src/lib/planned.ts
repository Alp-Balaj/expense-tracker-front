import { PlannedKind, Recurrence } from "@/Enums/enums";
import type { PlannedOccurrence, PlannedTransaction } from "@/Models/PlannedTransaction";
import { daysBetween } from "@/lib/dashboard";
import { toISODate, todayISO } from "@/lib/dates";

/**
 * Everything the planned pages derive rather than fetch: how a schedule reads in
 * words, how overdue something is, and what the queue adds up to.
 *
 * Pure, with `today` passed in, so the awkward cases are testable without
 * waiting for a particular date to come round.
 */

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "1st", "2nd", "3rd", "21st" — for describing a monthly anchor. */
export function ordinal(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

/**
 * The schedule in plain words. The anchor comes from the start date, exactly as
 * it does on the server, so this can never describe a schedule the backend does
 * not actually keep.
 */
export function describeRecurrence(recurrence: Recurrence, startDate: string): string {
  const iso = toISODate(startDate);
  const [year, month, day] = iso.split("-").map(Number);

  switch (recurrence) {
    case Recurrence.Once:
      return "One-off";
    case Recurrence.Weekly:
      return `Every ${WEEKDAYS[new Date(year, month - 1, day).getDay()]}`;
    case Recurrence.Monthly:
      // Anchors past the 28th get the caveat, because a short month pulls them
      // back to its last day — the same rule a bank applies to a standing order.
      return day > 28
        ? `Monthly on the ${ordinal(day)} (or the last day)`
        : `Monthly on the ${ordinal(day)}`;
    case Recurrence.Yearly:
      return `Yearly on ${day} ${MONTHS[month - 1]}`;
    default:
      return "";
  }
}

export type DueStanding = {
  /** Negative once overdue. */
  daysUntil: number;
  overdue: boolean;
  /** "Overdue by 3 days", "Due today", "Due in 5 days". */
  label: string;
};

export function dueStanding(dueDate: string, today: string = todayISO()): DueStanding {
  const daysUntil = daysBetween(today, toISODate(dueDate));

  if (daysUntil < 0) {
    const days = Math.abs(daysUntil);
    return { daysUntil, overdue: true, label: `Overdue by ${days} ${days === 1 ? "day" : "days"}` };
  }
  if (daysUntil === 0) return { daysUntil, overdue: false, label: "Due today" };

  return {
    daysUntil,
    overdue: false,
    label: `Due in ${daysUntil} ${daysUntil === 1 ? "day" : "days"}`,
  };
}

/** Oldest due first — the queue is a backlog, so the thing you have owed longest leads. */
export function sortQueue(occurrences: PlannedOccurrence[]): PlannedOccurrence[] {
  return [...occurrences].sort(
    (a, b) => toISODate(a.dueDate).localeCompare(toISODate(b.dueDate)) || a.id.localeCompare(b.id),
  );
}

export type QueueSummary = {
  count: number;
  overdue: number;
  /** What confirming everything in the queue would take out of the accounts. */
  owed: number;
  /** What confirming everything would bring in. */
  incoming: number;
};

/**
 * What the queue adds up to. Transfers are counted in neither total: the money
 * moves between the user's own accounts, so it is neither owed nor incoming.
 */
export function summarizeQueue(
  occurrences: PlannedOccurrence[],
  today: string = todayISO(),
): QueueSummary {
  let owed = 0;
  let incoming = 0;
  let overdue = 0;

  for (const occurrence of occurrences) {
    if (dueStanding(occurrence.dueDate, today).overdue) overdue += 1;
    if (occurrence.kind === PlannedKind.Expense) owed += occurrence.amount;
    else if (occurrence.kind === PlannedKind.Income) incoming += occurrence.amount;
  }

  return { count: occurrences.length, overdue, owed, incoming };
}

/**
 * Templates in the order the page lists them: the ones with something waiting
 * first, then by when they next come round, with paused ones last. A schedule
 * that needs attention should never be below one that is running itself.
 */
export function sortTemplates(templates: PlannedTransaction[]): PlannedTransaction[] {
  return [...templates].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    if ((a.pendingCount > 0) !== (b.pendingCount > 0)) return a.pendingCount > 0 ? -1 : 1;

    // A finished template has no next date; it sorts after everything live.
    if (a.nextDueDate && b.nextDueDate) {
      const byDate = toISODate(a.nextDueDate).localeCompare(toISODate(b.nextDueDate));
      if (byDate !== 0) return byDate;
    } else if (a.nextDueDate !== b.nextDueDate) {
      return a.nextDueDate ? -1 : 1;
    }

    return a.title.localeCompare(b.title);
  });
}

/** Which account field a kind actually uses, so the forms can ask for the right ones. */
export function accountRoles(kind: PlannedKind): { from: boolean; to: boolean } {
  switch (kind) {
    case PlannedKind.Expense: return { from: true, to: false };
    case PlannedKind.Income: return { from: false, to: true };
    default: return { from: true, to: true };
  }
}
