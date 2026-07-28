import { ArrowRightLeft, Check, TrendingDown, TrendingUp, X } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { PlannedKind } from "@/Enums/enums";
import type { PlannedOccurrence } from "@/Models/PlannedTransaction";
import { useCurrency } from "@/Hooks/useCurrency";
import { dueStanding, sortQueue, summarizeQueue } from "@/lib/planned";
import { formatDate } from "@/lib/dates";

const KIND_ICON = {
  [PlannedKind.Expense]: TrendingDown,
  [PlannedKind.Income]: TrendingUp,
  [PlannedKind.Transfer]: ArrowRightLeft,
};

interface DueQueueProps {
  occurrences: PlannedOccurrence[];
  onCommit: (occurrence: PlannedOccurrence) => void;
  onSkip: (occurrence: PlannedOccurrence) => void;
  busyId?: string | null;
}

/**
 * What is waiting to be confirmed.
 *
 * Deliberately the top of the page rather than a tab: this is the only part of
 * the feature that needs anything from the user, and a queue you have to go
 * looking for is a queue that grows.
 */
export function DueQueue({ occurrences, onCommit, onSkip, busyId }: DueQueueProps) {
  const { format, userCurrencyCode } = useCurrency();

  const queue = sortQueue(occurrences);
  const summary = summarizeQueue(queue);

  if (queue.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <Check className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium text-foreground">Nothing waiting</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything due so far has been dealt with. New ones appear here on the
          day they fall due.
        </p>
      </div>
    );
  }

  return (
    <section
      data-testid="due-queue"
      className="rounded-xl border border-border bg-card"
      aria-label="Waiting for confirmation"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Waiting for you
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {summary.count}
            </span>
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {summary.overdue > 0
              ? `${summary.overdue} past its due date`
              : "Confirm what actually happened"}
          </p>
        </div>
        <div className="text-right text-sm">
          {summary.owed > 0 && (
            <div className="font-semibold tabular-nums text-foreground">
              {format(summary.owed, userCurrencyCode)}{" "}
              <span className="font-normal text-muted-foreground">to pay</span>
            </div>
          )}
          {summary.incoming > 0 && (
            <div className="tabular-nums text-muted-foreground">
              {format(summary.incoming, userCurrencyCode)} incoming
            </div>
          )}
        </div>
      </header>

      <ul>
        {queue.map((occurrence) => {
          const standing = dueStanding(occurrence.dueDate);
          const Icon = KIND_ICON[occurrence.kind];
          const busy = busyId === occurrence.id;

          return (
            <li
              key={occurrence.id}
              className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0"
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  occurrence.kind === PlannedKind.Income ? "text-emerald-600" : "text-muted-foreground"
                }`}
              />

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {occurrence.title}
                </div>
                <div
                  className={`text-xs ${
                    standing.overdue ? "font-medium text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {standing.label} · {formatDate(occurrence.dueDate)}
                </div>
              </div>

              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {format(occurrence.amount, userCurrencyCode)}
              </span>

              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  onClick={() => onCommit(occurrence)}
                  disabled={busy}
                  className="h-8 gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSkip(occurrence)}
                  disabled={busy}
                  className="h-8 gap-1.5"
                  aria-label={`Skip ${occurrence.title}`}
                >
                  <X className="h-3.5 w-3.5" />
                  Skip
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
