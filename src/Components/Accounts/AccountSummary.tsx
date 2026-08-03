import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import type { Account } from "@/Models/Account";
import { AmountType } from "@/Enums/enums";
import { usableBalance } from "@/lib/dashboard";
import { useCurrency } from "@/Hooks/useCurrency";

interface AccountsSummaryProps {
  accounts: Account[];
}

export function AccountSummary({ accounts }: AccountsSummaryProps) {
  // These four tiles used to sum raw numbers across currencies and print the
  // result as dollars whatever the accounts were actually denominated in.
  // Stream V needed a truthful figure to subtract reserved money from, so each
  // account is now converted from its own currency into the user's, the way
  // every other total in the app already was.
  const { convert, userCurrencyCode } = useCurrency();

  // Every headline here answers "what have I got", so each one nets out what
  // savings goals reserved; the reserved figure is carried alongside so the
  // card can say where the difference went instead of just being smaller.
  const of = (types: AmountType[]) => {
    const matching = types.length
      ? accounts.filter((acc) => types.includes(acc.amountType))
      : accounts;
    return {
      usable: matching.reduce((sum, acc) => sum + convert(usableBalance(acc), acc.currencyCode), 0),
      reserved: matching.reduce(
        (sum, acc) => sum + convert(acc.reservedAmount ?? 0, acc.currencyCode),
        0,
      ),
    };
  };

  const total = of([]);
  const savings = of([AmountType.SavingsAccount]);
  const checking = of([AmountType.CheckingAccount]);
  const cash = of([AmountType.Cash]);

  // Already converted above, so this only puts the user's symbol on it.
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: userCurrencyCode,
      minimumFractionDigits: 2,
    }).format(amount);

  const summaryCards = [
    {
      title: "Total Balance",
      value: formatCurrency(total.usable),
      reserved: total.reserved,
      icon: Wallet,
      description: `Across ${accounts.length} account${accounts.length !== 1 ? "s" : ""}`,
      trend: total.usable >= 0 ? "up" : "down",
    },
    {
      title: "Checking",
      value: formatCurrency(checking.usable),
      reserved: checking.reserved,
      icon: TrendingUp,
      description: "Available to spend",
      trend: checking.usable >= 0 ? "up" : "down",
    },
    {
      title: "Savings",
      value: formatCurrency(savings.usable),
      reserved: savings.reserved,
      icon: PiggyBank,
      description: "Saved for later",
      trend: "up",
    },
    {
      title: "Cash",
      value: formatCurrency(cash.usable),
      reserved: cash.reserved,
      icon: TrendingDown,
      description: "Physical currency",
      trend: cash.usable >= 0 ? "up" : "down",
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
            {/*
              Only for the accounts a goal has spoken for — without one the card
              is byte-identical to what it has always shown.
            */}
            {card.reserved > 0 && (
              <p className="text-xs mt-0.5 text-muted-foreground">
                after {formatCurrency(card.reserved)} reserved by goals
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}