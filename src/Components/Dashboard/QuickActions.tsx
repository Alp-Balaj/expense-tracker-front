import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/Components/ui/tooltip";
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
    label: "Plan Expense - Coming soon",
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
    <Card className="bg-card border-border h-full">
      <CardContent className="h-full">
        <div className="grid grid-cols-2 gap-3 h-full">
          {actions.map((action) => (
            <Tooltip key={action.key}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handlers[action.key]}
                  className={`flex h-full w-full items-center justify-center border-border ${action.hoverColor} transition-colors cursor-pointer`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
