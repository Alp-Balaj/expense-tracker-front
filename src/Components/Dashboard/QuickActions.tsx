import { Button } from "@/Components/ui/button";
import { Receipt, TrendingUp, PiggyBank, CalendarClock } from "lucide-react";

export interface QuickActionsProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
  onAddSavingsGoal: () => void;
  onAddFutureExpense: () => void;
}

const actions = [
  {
    key: "expense",
    label: "Add Expense",
    icon: Receipt,
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
    hoverColor: "hover:bg-red-500/20",
  },
  {
    key: "income",
    label: "Add Income",
    icon: TrendingUp,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    hoverColor: "hover:bg-emerald-500/20",
  },
  {
    key: "savings",
    label: "New Savings Goal",
    icon: PiggyBank,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    hoverColor: "hover:bg-blue-500/20",
  },
  {
    key: "future",
    label: "Plan Expense",
    icon: CalendarClock,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    hoverColor: "hover:bg-amber-500/20",
  },
] as const;

export function QuickActions({
  onAddExpense,
  onAddIncome,
  onAddSavingsGoal,
  onAddFutureExpense,
}: QuickActionsProps) {
  const handlers: Record<string, () => void> = {
    expense: onAddExpense,
    income: onAddIncome,
    savings: onAddSavingsGoal,
    future: onAddFutureExpense,
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((action) => (
        <Button
          key={action.key}
          variant="outline"
          onClick={handlers[action.key]}
          className={`flex h-auto flex-col items-center gap-2 border-border py-5 ${action.hoverColor} transition-colors`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}
          >
            <action.icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-foreground">
            {action.label}
          </span>
        </Button>
      ))}
    </div>
  );
}
