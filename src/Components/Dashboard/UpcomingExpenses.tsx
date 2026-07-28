import { useMemo } from "react";
import { parseISO } from "date-fns";
import { Check } from "lucide-react";

import { Panel, PanelHeader } from "@/Components/Dashboard/Panel";
import { Button } from "@/Components/ui/button";
import type { PlannedOccurrence, PlannedTransaction } from "@/Models/PlannedTransaction";
import { useCurrency } from "@/Hooks/useCurrency";
import { toISODate } from "@/lib/dates";
import { billsDueWithin, upcomingBills, type UpcomingBill } from "@/lib/dashboard";

interface UpcomingExpensesProps {
  occurrences: PlannedOccurrence[];
  plans: PlannedTransaction[];
  isLoading: boolean;
  /** Opens the confirm dialog for an occurrence that has actually fallen due. */
  onConfirm?: (occurrence: PlannedOccurrence) => void;
}

/** How far ahead the summary line looks. */
const HORIZON_DAYS = 14;
const MAX_ROWS = 4;

function countdown(days: number) {
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return "today";
  return `${days}d`;
}

function longDate(bill: UpcomingBill) {
  return parseISO(toISODate(bill.date)).toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

/**
 * What is about to leave the account.
 *
 * Mixes two things on purpose: entries that have fallen due and are waiting for
 * you (confirmable right here — the note's one-click post) and the computed next
 * date of everything else, which is what makes this a look-ahead rather than a
 * list of things you are already late on.
 */
export function UpcomingExpenses({
  occurrences,
  plans,
  isLoading,
  onConfirm,
}: UpcomingExpensesProps) {
  const { format, userCurrencyCode } = useCurrency();

  const bills = useMemo(() => upcomingBills(occurrences, plans), [occurrences, plans]);
  const shown = bills.slice(0, MAX_ROWS);
  const dueSoon = billsDueWithin(bills, HORIZON_DAYS);

  const skeletonItems = ["a", "b", "c"];

  if (isLoading) {
    return (
      <Panel className="animate-pulse p-5">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="mt-4 h-16 rounded-xl bg-muted" />
        <div className="mt-3 space-y-3">
          {skeletonItems.map((id) => (
            <div key={id} className="h-3 w-full rounded bg-muted" />
          ))}
        </div>
      </Panel>
    );
  }

  if (shown.length === 0) {
    return (
      <Panel className="p-5">
        <PanelHeader title="Coming up" description="What you have planned ahead" />
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing planned. Rent, subscriptions and one-off payments you add will
          queue up here.
        </p>
      </Panel>
    );
  }

  const [next, ...rest] = shown;
  const overdue = next.daysUntil < 0;
  const waiting = bills.filter((bill) => bill.occurrence !== null).length;

  return (
    <Panel className="p-5">
      <PanelHeader
        title="Coming up"
        description={waiting > 0 ? `${waiting} waiting for you` : `${bills.length} planned`}
        meta={dueSoon > 0 ? `${format(dueSoon, userCurrencyCode)} in ${HORIZON_DAYS}d` : undefined}
      />

      {/* The nearest bill, given its own block. */}
      <div
        className={`mt-3.5 flex items-center gap-3 rounded-xl p-3 ${
          overdue ? "bg-destructive/10" : "bg-primary/10"
        }`}
      >
        <span
          className={`shrink-0 rounded-lg bg-card px-2.5 py-1.5 font-mono text-[11px] font-bold ${
            overdue ? "text-destructive" : "text-primary"
          }`}
        >
          {countdown(next.daysUntil)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-foreground">{next.title}</div>
          <div className="text-xs text-muted-foreground">{longDate(next)}</div>
        </div>
        <span className="shrink-0 text-[17px] font-bold tabular-nums text-foreground">
          {format(next.amount, userCurrencyCode)}
        </span>
        {/* Only what has genuinely fallen due can be confirmed — a look-ahead
            entry has no occurrence behind it yet. */}
        {next.occurrence && onConfirm && (
          <Button
            size="sm"
            onClick={() => onConfirm(next.occurrence as PlannedOccurrence)}
            className="h-8 shrink-0 gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            Confirm
          </Button>
        )}
      </div>

      {rest.length > 0 && (
        <ul className="mt-1">
          {rest.map((bill) => (
            <li
              key={bill.key}
              className="flex items-center gap-3 border-t border-border px-1 py-2.5"
            >
              <span className="w-9 shrink-0 font-mono text-[11px] text-muted-foreground">
                {countdown(bill.daysUntil)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{bill.title}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {format(bill.amount, userCurrencyCode)}
              </span>
              {bill.occurrence && onConfirm && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onConfirm(bill.occurrence as PlannedOccurrence)}
                  className="h-7 shrink-0 px-2"
                  aria-label={`Confirm ${bill.title}`}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
