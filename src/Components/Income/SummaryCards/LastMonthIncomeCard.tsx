import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { DollarSign } from "lucide-react";

type LastMonthIncomeCardProps = {
  lastMonthTotal: number;
  lastMonthLabel: string;
  formatCurrency: (value: number) => string;
};

export default function LastMonthIncomeCard({
  lastMonthTotal,
  lastMonthLabel,
  formatCurrency,
}: LastMonthIncomeCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Last Month</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {formatCurrency(lastMonthTotal)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{lastMonthLabel}</p>
      </CardContent>
    </Card>
  );
}
