import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { TrendingUp } from "lucide-react";

type AverageMonthlyCardProps = {
  avgMonthlyIncome: number;
  averageWindowLabel: string;
  formatCurrency: (value: number) => string;
};

export default function AverageMonthlyCard({
  avgMonthlyIncome,
  averageWindowLabel,
  formatCurrency,
}: AverageMonthlyCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Average Monthly
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {formatCurrency(avgMonthlyIncome)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{averageWindowLabel}</p>
      </CardContent>
    </Card>
  );
}
