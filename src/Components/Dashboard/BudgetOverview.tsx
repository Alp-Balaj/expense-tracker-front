import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { PieChart } from "lucide-react";
import { useCurrency } from "@/Hooks/useCurrency";
import { useBudgetStatusQuery } from "@/Hooks/queries/useBudgets";
import { BudgetProgressBar } from "@/Components/Budget/BudgetProgressBar";
import {
  budgetTone,
  budgetToneClasses,
  budgetsNeedingAttention,
  currentMonth,
} from "@/lib/budget";

/** The three category budgets closest to their limit this month. */
export function BudgetOverview() {
  const navigate = useNavigate();
  const { format, userCurrencyCode } = useCurrency();
  const month = currentMonth();
  const { data: statuses = [], isLoading } = useBudgetStatusQuery(month);

  const top = useMemo(() => budgetsNeedingAttention(statuses), [statuses]);
  const skeletonItems = ["a", "b", "c"];

  const header = (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Budgets</CardTitle>
          <CardDescription className="text-muted-foreground">
            Closest to their limit this month
          </CardDescription>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <PieChart className="h-4 w-4 text-primary" />
        </div>
      </div>
    </CardHeader>
  );

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        {header}
        <CardContent className="space-y-4">
          {skeletonItems.map((id) => (
            <div key={id} className="animate-pulse space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (top.length === 0) {
    return (
      <Card className="border-border bg-card">
        {header}
        <CardContent className="space-y-3">
          <p className="py-2 text-center text-sm text-muted-foreground">
            No budgets set yet.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/budgets")}
          >
            Set a budget
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      {header}
      <CardContent className="space-y-4">
        {top.map((status) => {
          const classes = budgetToneClasses[budgetTone(status.percentUsed)];

          return (
            <div key={status.id} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {status.categoryName}
                </span>
                <span className={`shrink-0 text-xs font-semibold ${classes.text}`}>
                  {Math.round(status.percentUsed)}%
                </span>
              </div>
              <BudgetProgressBar percentUsed={status.percentUsed} height="sm" />
              <p className="text-xs text-muted-foreground">
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

        <Button
          variant="ghost"
          className="w-full text-xs"
          onClick={() => navigate("/budgets")}
        >
          View all budgets
        </Button>
      </CardContent>
    </Card>
  );
}
