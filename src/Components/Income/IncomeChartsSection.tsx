import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/Components/ui/chart";

export type MonthlyTrendPoint = {
  month: string;
  income: number;
};

export type IncomeSourceSlice = {
  name: string;
  value: number;
  color: string;
};

type IncomeChartsSectionProps = {
  monthlyTrendData: MonthlyTrendPoint[];
  bySource: IncomeSourceSlice[];
  formatCurrency: (value: number) => string;

  lineChartConfig: any;
  pieChartConfig: any;

  className?: string;

  trendTitle?: string;
  trendDescription?: string;
  sourceTitle?: string;
  sourceDescription?: string;
};

export function IncomeChartsSection({
  monthlyTrendData,
  bySource,
  formatCurrency,
  lineChartConfig,
  pieChartConfig,
  className = "",
  trendTitle = "Income Trends",
  trendDescription = "Monthly income over the past 6 months",
  sourceTitle = "Income by Source",
  sourceDescription = "Breakdown of your income sources",
}: IncomeChartsSectionProps) {
  return (
    <div className={`grid gap-6 lg:grid-cols-5 mb-8 ${className}`}>
      {/* Income Trend Chart */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-foreground">{trendTitle}</CardTitle>
          <CardDescription>{trendDescription}</CardDescription>
        </CardHeader>

        <CardContent>
          <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="var(--color-income)"
                strokeWidth={2}
                dot={{ fill: "var(--color-income)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Income by Source Pie Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-foreground">{sourceTitle}</CardTitle>
          <CardDescription>{sourceDescription}</CardDescription>
        </CardHeader>

        <CardContent>
          <ChartContainer config={pieChartConfig} className="h-[250px] w-full">
            <PieChart>
              <Pie
                data={bySource}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {bySource.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>

              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
            </PieChart>
          </ChartContainer>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {bySource.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
