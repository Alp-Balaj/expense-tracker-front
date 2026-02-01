import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Calendar, TrendingDown, TrendingUp } from "lucide-react";

type ThisMonthIncomeCardProps = {
  currentMonthTotal: number;
  percentChange: number;
  formatCurrency: (value: number) => string;
};

export default function ThisMonthIncomeCard({
  currentMonthTotal,
  percentChange,
  formatCurrency,
}: ThisMonthIncomeCardProps) {
  const isUp = percentChange >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">This Month</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {formatCurrency(currentMonthTotal)}
        </div>

        <div className="flex items-center gap-1 mt-1">
          {isUp ? (
            <TrendingUp className="h-3 w-3 text-success" />
          ) : (
            <TrendingDown className="h-3 w-3 text-destructive" />
          )}

          <span
            className={`text-xs ${
              isUp ? "text-success" : "text-destructive"
            }`}
          >
            {isUp ? "+" : ""}
            {percentChange.toFixed(1)}% from last month
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
