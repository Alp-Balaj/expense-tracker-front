import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { Wallet } from "lucide-react";

export type IncomeByAccountItem = {
  name: string;
  value: number;
  percentage: number;
};

type IncomeByAccountCardProps = {
  byAccount: IncomeByAccountItem[];
  formatCurrency: (value: number) => string;
  className?: string;

  title?: string;
  description?: string;

  columnsClassName?: string;
};

export function IncomeByAccountCard({
  byAccount,
  formatCurrency,
  className = "",
  title = "Income by Account",
  description = "Distribution of income across your accounts",
  columnsClassName = "md:grid-cols-3",
}: IncomeByAccountCardProps) {
  return (
    <Card className={`mb-8 ${className}`}>
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className={`grid gap-4 ${columnsClassName}`}>
          {byAccount.map((account) => (
            <div
              key={account.name}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <p className="font-medium text-foreground">{account.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {account.percentage.toFixed(1)}% of total
                  </p>
                </div>
              </div>

              <p className="text-lg font-semibold text-foreground">
                {formatCurrency(account.value)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
