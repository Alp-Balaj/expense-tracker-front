import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import type { Account } from "@/Models/Account";
import { AmountType } from "@/Enums/enums";

interface AccountsSummaryProps {
  accounts: Account[];
}

export function AccountSummary({ accounts }: AccountsSummaryProps) {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const savingsBalance = accounts
    .filter((acc) => acc.amountType === AmountType.SavingsAccount)
    .reduce((sum, acc) => sum + acc.balance, 0);

  const checkingBalance = accounts
    .filter((acc) => acc.amountType === AmountType.CheckingAccount)
    .reduce((sum, acc) => sum + acc.balance, 0);

  const cashBalance = accounts
    .filter((acc) => acc.amountType === AmountType.Cash)
    .reduce((sum, acc) => sum + acc.balance, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const summaryCards = [
    {
      title: "Total Balance",
      value: formatCurrency(totalBalance),
      icon: Wallet,
      description: `Across ${accounts.length} account${accounts.length !== 1 ? "s" : ""}`,
      trend: totalBalance >= 0 ? "up" : "down",
    },
    {
      title: "Checking",
      value: formatCurrency(checkingBalance),
      icon: TrendingUp,
      description: "Available to spend",
      trend: checkingBalance >= 0 ? "up" : "down",
    },
    {
      title: "Savings",
      value: formatCurrency(savingsBalance),
      icon: PiggyBank,
      description: "Saved for later",
      trend: "up",
    },
    {
      title: "Cash",
      value: formatCurrency(cashBalance),
      icon: TrendingDown,
      description: "Physical currency",
      trend: cashBalance >= 0 ? "up" : "down",
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {summaryCards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-foreground truncate">
              {card.value}
            </div>
            <p className={`text-xs mt-1 ${ card.trend === "up" ? "text-primary" : "text-destructive"}`}>
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}