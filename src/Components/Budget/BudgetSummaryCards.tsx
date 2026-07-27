import { Card, CardContent } from "@/Components/ui/card";
import { Target, TrendingDown, PiggyBank, AlertTriangle } from "lucide-react";
import type { BudgetStatus } from "@/Models/Budget";
import { useCurrency } from "@/Hooks/useCurrency";
import { budgetTone } from "@/lib/budget";

interface BudgetSummaryCardsProps {
  statuses: BudgetStatus[];
}

export function BudgetSummaryCards({ statuses }: BudgetSummaryCardsProps) {
  const { format, userCurrencyCode } = useCurrency();

  // The overall budget covers the same spend as the category budgets, so
  // totalling both would double-count. Category budgets are the sum here;
  // the overall budget gets its own card.
  const categoryBudgets = statuses.filter((s) => s.categoryId !== null);
  const budgeted = categoryBudgets.reduce((sum, s) => sum + s.limit, 0);
  const spent = categoryBudgets.reduce((sum, s) => sum + s.spent, 0);
  const remaining = budgeted - spent;
  const overCount = statuses.filter((s) => budgetTone(s.percentUsed) === "over").length;

  const cards = [
    {
      label: "Budgeted",
      value: format(budgeted, userCurrencyCode),
      icon: Target,
      tint: "text-primary",
    },
    {
      label: "Spent",
      value: format(spent, userCurrencyCode),
      icon: TrendingDown,
      tint: "text-foreground",
    },
    {
      label: remaining < 0 ? "Overspent" : "Left to spend",
      value: format(Math.abs(remaining), userCurrencyCode),
      icon: PiggyBank,
      tint: remaining < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400",
    },
    {
      label: "Over budget",
      value: `${overCount} ${overCount === 1 ? "budget" : "budgets"}`,
      icon: AlertTriangle,
      tint: overCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className={`truncate text-xl font-bold ${card.tint}`}>{card.value}</p>
            </div>
            <card.icon className={`h-5 w-5 shrink-0 ${card.tint}`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
