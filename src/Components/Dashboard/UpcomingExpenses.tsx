import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { CalendarClock } from "lucide-react";
import type { FutureExpense } from "@/Models/FutureExpense";

interface UpcomingExpensesProps {
  futureExpenses: FutureExpense[];
  isLoading: boolean;
}

function formatEur(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function daysUntil(date: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyBadge(days: number) {
  if (days < 0)
    return {
      label: "Overdue",
      className:
        "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    };
  if (days <= 7)
    return {
      label: `${days}d left`,
      className:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    };
  if (days <= 30)
    return {
      label: `${days}d left`,
      className:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    };
  return {
    label: `${days}d left`,
    className: "bg-muted text-muted-foreground border-border",
  };
}

export function UpcomingExpenses({
  futureExpenses,
  isLoading,
}: UpcomingExpensesProps) {
  const sorted = useMemo(
    () =>
      [...futureExpenses]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5),
    [futureExpenses],
  );

  const totalUpcoming = useMemo(
    () => futureExpenses.reduce((s, e) => s + e.amount, 0),
    [futureExpenses],
  );
  const skeletonItems = ["a", "b", "c"];

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Upcoming Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {skeletonItems.map((id) => (
            <div key={id} className="flex items-center gap-3 animate-pulse">
              <div className="h-9 w-9 rounded-lg bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-28 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (sorted.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Upcoming Expenses</CardTitle>
          <CardDescription className="text-muted-foreground">
            Planned future expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-6 text-center">
            No planned expenses yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Upcoming Expenses</CardTitle>
            <CardDescription className="text-muted-foreground">
              {futureExpenses.length} planned &middot;{" "}
              {formatEur(totalUpcoming)} total
            </CardDescription>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
            <CalendarClock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {sorted.map((item) => {
            const days = daysUntil(item.date);
            const badge = urgencyBadge(days);
            const d = new Date(item.date);
            const dateStr = d.toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{dateStr}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-normal ${badge.className}`}
                >
                  {badge.label}
                </Badge>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatEur(item.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
