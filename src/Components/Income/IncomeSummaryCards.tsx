import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import {
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

export type IncomeStats = {
  currentMonthTotal: number;
  lastMonthTotal: number;
  avgMonthlyIncome: number;
  percentChange: number;
  topSource: {
    name: string;
    percentage: number;
  };
};

type IncomeSummaryCardsProps = {
  stats: IncomeStats;
  formatCurrency: (value: number) => string;
  lastMonthLabel?: string;
  averageWindowLabel?: string;
  className?: string;
};

export function IncomeSummaryCards({
  stats,
  formatCurrency,
  lastMonthLabel = "Last month total",
  averageWindowLabel = "Over the last 6 months",
  className = "",
}: IncomeSummaryCardsProps) {
  const isUp = stats.percentChange >= 0;

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 ${className}`}>
      {/* This Month Income */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(stats.currentMonthTotal)}
          </div>

          <div className="flex items-center gap-1 mt-1">
            {isUp ? (
              <TrendingUp className="h-3 w-3 text-success" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}

            <span className={`text-xs ${isUp ? "text-success" : "text-destructive"}`}>
              {isUp ? "+" : ""}
              {stats.percentChange.toFixed(1)}% from last month
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Last Month Income */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Last Month</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(stats.lastMonthTotal)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{lastMonthLabel}</p>
        </CardContent>
      </Card>

      {/* Average Monthly */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Average Monthly
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(stats.avgMonthlyIncome)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{averageWindowLabel}</p>
        </CardContent>
      </Card>

      {/* Top Source */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Top Source</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.topSource?.name ?? "—"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {(stats.topSource?.percentage ?? 0).toFixed(1)}% of total income
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
