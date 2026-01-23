import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/Components/ui/chart";
import type { Category } from "@/Models/Category";
import { CategoryType } from "@/Enums/enums";
import { Bar, BarChart, XAxis, YAxis, Cell, Pie, PieChart } from "recharts";

interface CategoryChartProps {
  categories: Category[];
  type: CategoryType;
  chartType?: "bar" | "pie";
}

const typeLabels: Record<CategoryType, string> = {
  [CategoryType.Expense]: "Expenses",
  [CategoryType.Income]: "Income",
  [CategoryType.Savings]: "Savings",
  [CategoryType.FutureExpense]: "Future Expenses",
};

const typeDescriptions: Record<CategoryType, string> = {
  [CategoryType.Expense]: "Breakdown of your expense categories",
  [CategoryType.Income]: "Breakdown of your income sources",
  [CategoryType.Savings]: "Breakdown of your savings categories",
  [CategoryType.FutureExpense]: "Breakdown of your planned future expenses",
};

export function CategoryChart({ categories, type, chartType = "bar" }: CategoryChartProps) {
  const chartData = categories.map((cat) => ({
    name: cat.name,
    amount: cat?.totalAmount || 0,
    fill: cat.color,
  }));

  const chartConfig = categories.reduce((acc, cat) => {
    acc[cat.name] = {
      label: cat.name,
      color: cat.color,
    };
    return acc;
  }, {} as ChartConfig);

  const total = chartData.reduce((sum, item) => sum + item.amount, 0);

  if (categories.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>{typeLabels[type]}</CardTitle>
          <CardDescription>{typeDescriptions[type]}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          No categories found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{typeLabels[type]}</CardTitle>
            <CardDescription>{typeDescriptions[type]}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">
              €{total.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          {chartType === "bar" ? (
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={100}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="amount" radius={4}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
