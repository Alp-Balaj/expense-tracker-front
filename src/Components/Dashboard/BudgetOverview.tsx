import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Panel, PanelHeader } from "@/Components/Dashboard/Panel";
import { Button } from "@/Components/ui/button";
import { useCurrency } from "@/Hooks/useCurrency";
import type { BudgetStatus } from "@/Models/Budget";
import { BudgetProgressBar } from "@/Components/Budget/BudgetProgressBar";
import { budgetTone, budgetToneClasses, budgetsNeedingAttention } from "@/lib/budget";

interface BudgetOverviewProps {
  /** This month's statuses, already fetched by the dashboard. */
  statuses: BudgetStatus[];
  isLoading: boolean;
}

/**
 * The category budgets closest to their limit. The overall budget is not
 * repeated here — the hero card already measures against it.
 */
export function BudgetOverview({ statuses, isLoading }: BudgetOverviewProps) {
  const navigate = useNavigate();
  const { format, userCurrencyCode } = useCurrency();

  const top = useMemo(() => budgetsNeedingAttention(statuses), [statuses]);
  const skeletonItems = ["a", "b", "c"];

  if (isLoading) {
    return (
      <Panel className="animate-pulse p-5">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="mt-4 space-y-4">
          {skeletonItems.map((id) => (
            <div key={id} className="space-y-2">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-1.5 w-full rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  if (top.length === 0) {
    return (
      <Panel className="p-5">
        <PanelHeader title="Budgets" description="Closest to their limit this month" />
        <p className="py-6 text-center text-sm text-muted-foreground">No budgets set yet.</p>
        <Button variant="outline" className="w-full" onClick={() => navigate("/budgets")}>
          Set a budget
        </Button>
      </Panel>
    );
  }

  return (
    <Panel className="p-5">
      <PanelHeader
        title="Budgets"
        description="Closest to their limit this month"
        action={
          <Button
            variant="ghost"
            size="sm"
            className="-mr-2 h-auto shrink-0 gap-1 px-2 py-1 text-xs font-semibold text-primary"
            onClick={() => navigate("/budgets")}
          >
            All
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        }
      />

      <div className="mt-3.5 space-y-3.5">
        {top.map((status) => {
          const classes = budgetToneClasses[budgetTone(status.percentUsed)];

          return (
            <div key={status.id} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-foreground">
                  {status.categoryName}
                </span>
                <span className={`shrink-0 font-mono text-[11px] font-bold ${classes.text}`}>
                  {Math.round(status.percentUsed)}%
                </span>
              </div>
              <BudgetProgressBar percentUsed={status.percentUsed} height="sm" />
              <p className="text-[11.5px] text-muted-foreground">
                {format(status.spent, userCurrencyCode)} of{" "}
                {format(status.limit, userCurrencyCode)}
                {status.remaining < 0 && (
                  <span className={`ml-1 font-medium ${classes.text}`}>
                    &middot; {format(Math.abs(status.remaining), userCurrencyCode)} over
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
