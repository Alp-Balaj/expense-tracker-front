import { Button } from "@/Components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { currentMonth, formatMonth, shiftMonth } from "@/lib/budget";

interface MonthSelectorProps {
  month: string;
  onChange: (month: string) => void;
}

export function MonthSelector({ month, onChange }: MonthSelectorProps) {
  const thisMonth = currentMonth();
  const isCurrent = month === thisMonth;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="min-w-36 text-center text-sm font-medium text-foreground">
        {formatMonth(month)}
      </span>

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onChange(shiftMonth(month, 1))}
        // Budgets recur forever, so future months are viewable but empty —
        // stopping at the current month keeps the control honest.
        disabled={month >= thisMonth}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isCurrent && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 text-xs"
          onClick={() => onChange(thisMonth)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          This month
        </Button>
      )}
    </div>
  );
}
