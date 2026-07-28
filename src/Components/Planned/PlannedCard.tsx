import { ArrowRightLeft, Pause, Pencil, Play, TrendingDown, TrendingUp, Trash2 } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { PlannedKind, Recurrence } from "@/Enums/enums";
import type { PlannedTransaction } from "@/Models/PlannedTransaction";
import { useCurrency } from "@/Hooks/useCurrency";
import { describeRecurrence, dueStanding } from "@/lib/planned";
import { formatDate } from "@/lib/dates";

const KIND_META = {
  [PlannedKind.Expense]: { icon: TrendingDown, label: "Expense", tone: "text-foreground" },
  [PlannedKind.Income]: { icon: TrendingUp, label: "Income", tone: "text-emerald-600 dark:text-emerald-400" },
  [PlannedKind.Transfer]: { icon: ArrowRightLeft, label: "Transfer", tone: "text-blue-600 dark:text-blue-400" },
};

interface PlannedCardProps {
  plan: PlannedTransaction;
  onEdit: (plan: PlannedTransaction) => void;
  onTogglePause: (plan: PlannedTransaction) => void;
  onDelete: (plan: PlannedTransaction) => void;
}

export function PlannedCard({ plan, onEdit, onTogglePause, onDelete }: PlannedCardProps) {
  const { format, userCurrencyCode } = useCurrency();

  const meta = KIND_META[plan.kind];
  const Icon = meta.icon;

  // A one-off that has already been dealt with has no next date and nothing
  // pending — worth saying so plainly rather than leaving the line blank.
  const finished = plan.nextDueDate === null && plan.pendingCount === 0;

  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 shrink-0 ${meta.tone}`} />
            <h3 className="truncate font-semibold text-foreground">{plan.title}</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {describeRecurrence(plan.recurrence, plan.startDate)}
          </p>
        </div>
        <span className="shrink-0 text-lg font-bold tabular-nums text-foreground">
          {format(plan.amount, userCurrencyCode)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {!plan.isActive && (
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
            Paused
          </span>
        )}
        {plan.pendingCount > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
            {plan.pendingCount} waiting
          </span>
        )}
        {plan.recurrence === Recurrence.Once && (
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
            One-off
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {!plan.isActive
          ? "Paused — nothing new will be queued."
          : finished
            ? "Finished."
            : plan.nextDueDate
              ? `Next ${formatDate(plan.nextDueDate)} · ${dueStanding(plan.nextDueDate).label.toLowerCase()}`
              : "Nothing further scheduled."}
      </p>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(plan)}
          className="h-8 gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onTogglePause(plan)}
          className="h-8 gap-1.5"
        >
          {plan.isActive ? (
            <>
              <Pause className="h-3.5 w-3.5" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              Resume
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(plan)}
          className="ml-auto h-8 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Delete ${plan.title}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}
