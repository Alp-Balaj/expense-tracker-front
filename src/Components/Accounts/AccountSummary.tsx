"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import type { Account } from "@/Models/Account";

interface AccountsSummaryProps {
  accounts: Account[];
}

export function AccountSummary({ accounts }: AccountsSummaryProps) {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const savingsBalance = accounts
    .filter((acc) => acc.type === "savings")
    .reduce((sum, acc) => sum + acc.balance, 0);

  const checkingBalance = accounts
    .filter((acc) => acc.type === "checking")
    .reduce((sum, acc) => sum + acc.balance, 0);

  const cashBalance = accounts
    .filter((acc) => acc.type === "cash")
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {summaryCards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {card.value}
            </div>
            <p className={`text-xs mt-1 ${ card.trend === "up" ? "text-muted-foreground" : "text-destructive"}`}>
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}