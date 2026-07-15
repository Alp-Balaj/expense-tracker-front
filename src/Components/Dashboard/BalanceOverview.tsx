import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Wallet, TrendingDown, TrendingUp, Scale } from "lucide-react";
import type { Account } from "@/Models/Account";
import type { Expense } from "@/Models/Expense";
import type { Income } from "@/Models/Income";
import { useMemo } from "react";
import { useCurrency } from "@/Hooks/useCurrency";

interface BalanceOverviewProps {
  accounts: Account[];
  expenses: Expense[];
  incomes: Income[];
  isLoading: boolean;
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
  const { format, convert, userCurrencyCode } = useCurrency();

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + convert(a.balance ?? 0, a.currencyCode), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      value: format(totalBalance, userCurrencyCode),
      icon: Wallet,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      sub: `${accounts.length} account${accounts.length !== 1 ? "s" : ""}`,
      subColor: "text-muted-foreground",
    },
    {
      title: "Income this Month",
      value: format(monthlyIncome, userCurrencyCode),
      icon: TrendingUp,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      sub: `${getMonthEntries(incomes).length} entries`,
      subColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Expenses this Month",
      value: format(monthlyExpenses, userCurrencyCode),
      icon: TrendingDown,
      iconBg: "bg-red-500/10",
      iconColor: "text-red-600 dark:text-red-400",
      sub: `${getMonthEntries(expenses).length} entries`,
      subColor: "text-red-600 dark:text-red-400",
    },
    {
      title: "Net this Month",
      value: format(netThisMonth, userCurrencyCode),
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
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 h-full">
        {skeletonItems.map((id) => (
          <Card key={id} className="bg-card border-border animate-pulse h-full">
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
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 h-full">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div
              className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}
            >
              <card.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-foreground truncate">
              {card.value}
            </div>
            <p className={`text-xs mt-1 ${card.subColor}`}>{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
