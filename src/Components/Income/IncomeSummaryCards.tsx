import ThisMonthIncomeCard from "./SummaryCards/ThisMonthIncomeCard";
import LastMonthIncomeCard from "./SummaryCards/LastMonthIncomeCard";
import AverageMonthlyCard from "./SummaryCards/AverageMonthlyCard";
import TopSourceCard from "./SummaryCards/TopSourceCard";

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
  averageWindowLabel?: string;
  className?: string;
};

export function IncomeSummaryCards({
  stats,
  formatCurrency,
  className = "",
}: IncomeSummaryCardsProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 ${className}`}>
      {/* This Month Income */}
      <ThisMonthIncomeCard currentMonthTotal={stats.currentMonthTotal} percentChange={stats.percentChange} formatCurrency={formatCurrency} />

      {/* Last Month Income */}
      <LastMonthIncomeCard lastMonthTotal={stats.lastMonthTotal} lastMonthLabel={"Last month total"} formatCurrency={formatCurrency}/>

      {/* Average Monthly */}
      <AverageMonthlyCard avgMonthlyIncome={stats.avgMonthlyIncome} averageWindowLabel="Over the last 6 months" formatCurrency={formatCurrency}/>

      {/* Top Source */}
      <TopSourceCard name={stats.topSource.name} percentage={stats.topSource.percentage}/>
    </div>
  );
}
