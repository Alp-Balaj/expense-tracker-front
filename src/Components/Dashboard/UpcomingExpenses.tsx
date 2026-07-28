import { useMemo } from "react";
import { parseISO } from "date-fns";
import { ArrowRightLeft, Check, TrendingDown, TrendingUp } from "lucide-react";

import { Panel, PanelHeader } from "@/Components/Dashboard/Panel";
import { Button } from "@/Components/ui/button";
import { PlannedKind } from "@/Enums/enums";
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

/**
 * How each kind reads on the dashboard.
 *
 * Two conventions meet here and both are kept. The arrow and its colour are the
 * Planned feature's own language, so a row means the same thing here as it does
 * on the Planned page. The signed, tinted amount is the dashboard's — the same
 * treatment the ledger card next to this one gives money in versus money out.
 *
 * Expense is the quiet default: its arrow stays muted so income is the thing
 * that catches the eye, which is the only case where "coming up" is good news.
 * The sign carries the meaning on its own, so nothing here depends on colour.
 */
const KIND_META = {
  [PlannedKind.Expense]: {
    icon: TrendingDown,
    label: "Expense",
    iconTone: "text-muted-foreground",
    amountTone: "text-foreground",
    sign: "−",
  },
  [PlannedKind.Income]: {
    icon: TrendingUp,
    label: "Income",
    iconTone: "text-secondary",
    amountTone: "text-secondary",
    sign: "+",
  },
  [PlannedKind.Transfer]: {
    icon: ArrowRightLeft,
    label: "Transfer",
    iconTone: "text-blue-600 dark:text-blue-400",
    amountTone: "text-foreground",
    // Neither in nor out — a sign would claim something untrue.
    sign: "",
  },
};

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
 * What is about to move through the account, in either direction.
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
  const nextMeta = KIND_META[next.kind];
  const NextIcon = nextMeta.icon;
  // Late money coming *in* is not a debt, so it never gets the alarm treatment.
  const overdue = next.daysUntil < 0 && next.kind !== PlannedKind.Income;
  const incoming = next.kind === PlannedKind.Income;
  const waiting = bills.filter((bill) => bill.occurrence !== null).length;

  const blockTint = incoming ? "bg-secondary/10" : overdue ? "bg-destructive/10" : "bg-primary/10";
  const chipTone = incoming ? "text-secondary" : overdue ? "text-destructive" : "text-primary";

  return (
    <Panel className="p-5">
      <PanelHeader
        title="Coming up"
        description={waiting > 0 ? `${waiting} waiting for you` : `${bills.length} planned`}
        meta={dueSoon > 0 ? `${format(dueSoon, userCurrencyCode)} in ${HORIZON_DAYS}d` : undefined}
      />

      {/* The nearest bill, given its own block. */}
      <div className={`mt-3.5 flex items-center gap-3 rounded-xl p-3 ${blockTint}`}>
        <span
          className={`shrink-0 rounded-lg bg-card px-2.5 py-1.5 font-mono text-[11px] font-bold ${chipTone}`}
        >
          {countdown(next.daysUntil)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <NextIcon aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${nextMeta.iconTone}`} />
            <span className="min-w-0 truncate text-[15px] font-semibold text-foreground">
              <span className="sr-only">{nextMeta.label}: </span>
              {next.title}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">{longDate(next)}</div>
        </div>
        <span className={`shrink-0 text-[17px] font-bold tabular-nums ${nextMeta.amountTone}`}>
          {nextMeta.sign}
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
          {rest.map((bill) => {
            const meta = KIND_META[bill.kind];
            const Icon = meta.icon;

            return (
              <li
                key={bill.key}
                className="flex items-center gap-3 border-t border-border px-1 py-2.5"
              >
                <span className="w-9 shrink-0 font-mono text-[11px] text-muted-foreground">
                  {countdown(bill.daysUntil)}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <Icon aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${meta.iconTone}`} />
                  <span className="min-w-0 truncate text-sm text-foreground">
                    <span className="sr-only">{meta.label}: </span>
                    {bill.title}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${meta.amountTone}`}
                >
                  {meta.sign}
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
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
