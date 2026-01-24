"use client";

import { Card, CardContent } from "@/Components/ui/card";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((card) => (
        <Card key={card.title} className="border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-primary">{card.title}</p>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p
                className={`text-xs mt-1 ${
                  card.trend === "up" ? "text-success" : "text-destructive"
                }`}
              >
                {card.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}