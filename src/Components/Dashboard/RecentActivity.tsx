import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Receipt, TrendingUp, PiggyBank, ArrowRight } from "lucide-react";
import type { Expense } from "@/Models/Expense";
import type { Income } from "@/Models/Income";
import type { Account } from "@/Models/Account";
import type { Category } from "@/Models/Category";
import { useNavigate } from "react-router-dom";
import { Button } from "@/Components/ui/button";

type UnifiedEntry = {
  id: string;
  type: "expense" | "income" | "saving";
  title: string;
  amount: number;
  date: Date;
  accountName: string;
  categoryName: string;
};

interface RecentActivityProps {
  expenses: Expense[];
  incomes: Income[];
  accounts: Account[];
  categories: Category[];
  isLoading: boolean;
}

function formatEur(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(date: Date) {
  const d = new Date(date);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
  });
}

const iconMap = {
  expense: Receipt,
  income: TrendingUp,
  saving: PiggyBank,
};

const colorMap = {
  expense: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    badge:
      "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    sign: "-",
  },
  income: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    badge:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    sign: "+",
  },
  saving: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    badge:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    sign: "",
  },
};

export function RecentActivity({
  expenses,
  incomes,
  accounts,
  categories,
  isLoading,
}: RecentActivityProps) {
  const navigate = useNavigate();

  const accountMap = useMemo(() => {
    const m = new Map<string, string>();
    accounts.forEach((a) => {
      m.set(a.id, a.name);
    });
    return m;
  }, [accounts]);

  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => {
      m.set(c.id, c.name);
    });
    return m;
  }, [categories]);

  const entries = useMemo(() => {
    const unified: UnifiedEntry[] = [];

    expenses.forEach((e) => {
      if (!e.id) return;
      unified.push({
        id: e.id,
        type: "expense",
        title: e.title,
        amount: e.amount,
        date: e.date,
        accountName: accountMap.get(e.accountId) ?? "Unknown",
        categoryName: categoryMap.get(e.categoryId) ?? "Uncategorized",
      });
    });

    incomes.forEach((i) => {
      if (!i.id) return;
      unified.push({
        id: i.id,
        type: "income",
        title: i.title,
        amount: i.amount,
        date: i.date,
        accountName: accountMap.get(i.accountId) ?? "Unknown",
        categoryName: categoryMap.get(i.categoryId) ?? "Uncategorized",
      });
    });

    unified.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return unified.slice(0, 8);
  }, [expenses, incomes, accountMap, categoryMap]);

  const skeletonItems = ["a", "b", "c", "d", "e"];

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skeletonItems.map((id) => (
            <div key={id} className="flex items-center gap-4 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activity</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your latest transactions across all accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            No activity yet. Use the quick actions above to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Recent Activity</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your latest transactions across all accounts
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary gap-1"
          onClick={() => navigate("/reports")}
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {entries.map((entry) => {
            const colors = colorMap[entry.type];
            const Icon = iconMap[entry.type];
            return (
              <div
                key={`${entry.type}-${entry.id}`}
                className="flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}
                >
                  <Icon className={`h-4 w-4 ${colors.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {entry.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.accountName} &middot; {formatDate(entry.date)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-normal hidden sm:inline-flex ${colors.badge}`}
                  >
                    {entry.categoryName}
                  </Badge>
                  <span
                    className={`text-sm font-semibold tabular-nums ${colors.text}`}
                  >
                    {colors.sign}
                    {formatEur(entry.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
