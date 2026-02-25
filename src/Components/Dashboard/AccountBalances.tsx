import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import {
  Wallet,
  PiggyBank,
  Banknote,
  CreditCard,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import type { Account } from "@/Models/Account";
import { AmountType } from "@/Enums/enums";
import { useNavigate } from "react-router-dom";

interface AccountBalancesProps {
  accounts: Account[];
  isLoading: boolean;
}

function formatEur(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

const accountTypeIcon: Record<number, typeof Wallet> = {
  [AmountType.CheckingAccount]: Wallet,
  [AmountType.SavingsAccount]: PiggyBank,
  [AmountType.Cash]: Banknote,
  [AmountType.CreditCard]: CreditCard,
  [AmountType.Investment]: TrendingUp,
};

const accountTypeName: Record<number, string> = {
  [AmountType.CheckingAccount]: "Checking",
  [AmountType.SavingsAccount]: "Savings",
  [AmountType.Cash]: "Cash",
  [AmountType.CreditCard]: "Credit Card",
  [AmountType.Investment]: "Investment",
};

export function AccountBalances({ accounts, isLoading }: AccountBalancesProps) {
  const navigate = useNavigate();
  const skeletonItems = ["a", "b", "c"];

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {skeletonItems.map((id) => (
            <div
              key={`account-skeleton-${id}`}
              className="flex items-center gap-3 animate-pulse"
            >
              <div className="h-9 w-9 rounded-lg bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Accounts</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your connected accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-6 text-center">
            No accounts yet.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/account")}
          >
            Add your first account
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Accounts</CardTitle>
          <CardDescription className="text-muted-foreground">
            Balance across all accounts
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary gap-1"
          onClick={() => navigate("/account")}
        >
          Manage
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {accounts.map((account) => {
            const Icon = accountTypeIcon[account.amountType] ?? Wallet;
            const typeName = accountTypeName[account.amountType] ?? "Account";
            const isNegative = account.balance < 0;

            return (
              <div
                key={account.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {account.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{typeName}</p>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    isNegative
                      ? "text-red-600 dark:text-red-400"
                      : "text-foreground"
                  }`}
                >
                  {formatEur(account.balance)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
