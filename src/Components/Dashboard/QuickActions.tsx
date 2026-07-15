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
    shortLabel: "Expense",
    icon: Receipt,
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
    hoverColor: "hover:bg-red-500/20",
  },
  {
    key: "income",
    label: "Add Income",
    shortLabel: "Income",
    icon: TrendingUp,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    hoverColor: "hover:bg-emerald-500/20",
  },
  {
    key: "savings",
    label: "New Savings Goal",
    shortLabel: "Savings",
    icon: PiggyBank,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    hoverColor: "hover:bg-blue-500/20",
  },
  {
    key: "future",
    label: "Plan Expense - Coming soon",
    shortLabel: "Plan",
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
      <CardContent className="h-full pt-4 sm:pt-6">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 h-full min-h-[160px]">
          {actions.map((action) => (
            <Tooltip key={action.key}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handlers[action.key]}
                  className={`flex flex-col h-full w-full items-center justify-center gap-1.5 border-border ${action.hoverColor} transition-colors cursor-pointer py-3`}
                >
                  <div
                    className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl ${action.color}`}
                  >
                    <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-medium text-foreground/70 leading-tight text-center">
                    {action.shortLabel}
                  </span>
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
