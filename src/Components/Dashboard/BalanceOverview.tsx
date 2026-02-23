import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Wallet, TrendingDown, TrendingUp, Scale } from "lucide-react";
import type { Account } from "@/Models/Account";
import type { Expense } from "@/Models/Expense";
import type { Income } from "@/Models/Income";
import { useMemo } from "react";

interface BalanceOverviewProps {
  accounts: Account[];
  expenses: Expense[];
  incomes: Income[];
  isLoading: boolean;
}

function formatEur(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function getMonthEntries<T extends { date: Date }>(items: T[]) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return items.filter((item) => {
    const d = new Date(item.date);
    return d.getFullYear() === y && d.getMonth() === m;
  });
}

export function BalanceOverview({
  accounts,
  expenses,
  incomes,
  isLoading,
}: BalanceOverviewProps) {
  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0),
    [accounts],
  );

  const monthlyExpenses = useMemo(
    () => getMonthEntries(expenses).reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  const monthlyIncome = useMemo(
    () => getMonthEntries(incomes).reduce((sum, i) => sum + i.amount, 0),
    [incomes],
  );

  const netThisMonth = monthlyIncome - monthlyExpenses;

  const cards = [
    {
      title: "Total Balance",
      value: formatEur(totalBalance),
      icon: Wallet,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      sub: `${accounts.length} account${accounts.length !== 1 ? "s" : ""}`,
      subColor: "text-muted-foreground",
    },
    {
      title: "Income this Month",
      value: formatEur(monthlyIncome),
      icon: TrendingUp,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      sub: `${getMonthEntries(incomes).length} entries`,
      subColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Expenses this Month",
      value: formatEur(monthlyExpenses),
      icon: TrendingDown,
      iconBg: "bg-red-500/10",
      iconColor: "text-red-600 dark:text-red-400",
      sub: `${getMonthEntries(expenses).length} entries`,
      subColor: "text-red-600 dark:text-red-400",
    },
    {
      title: "Net this Month",
      value: formatEur(netThisMonth),
      icon: Scale,
      iconBg: netThisMonth >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
      iconColor:
        netThisMonth >= 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400",
      sub: netThisMonth >= 0 ? "You're on track" : "Spending exceeds income",
      subColor:
        netThisMonth >= 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400",
    },
  ];
  const skeletonItems = ["a", "b", "c"];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {skeletonItems.map((id) => (
          <Card key={id} className="bg-card border-border animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 w-24 rounded bg-muted mb-3" />
              <div className="h-7 w-32 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg}`}
            >
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {card.value}
            </div>
            <p className={`text-xs mt-1 ${card.subColor}`}>{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
