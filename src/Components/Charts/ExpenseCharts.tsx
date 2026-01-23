import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Pie,
  PieChart,
  Cell,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/Components/ui/chart";

const expenseTrendData = [
  { month: "Aug", expenses: 2100, income: 4800 },
  { month: "Sep", expenses: 2450, income: 5100 },
  { month: "Oct", expenses: 2200, income: 4950 },
  { month: "Nov", expenses: 2680, income: 5300 },
  { month: "Dec", expenses: 3100, income: 5500 },
  { month: "Jan", expenses: 2848, income: 5240 },
];

// Fake data for expense categories
const expenseCategoryData = [
  { name: "Housing", value: 1200, fill: "#c96442" },
  { name: "Food", value: 580, fill: "#d4845f" },
  { name: "Transport", value: 420, fill: "#e0a57c" },
  { name: "Utilities", value: 280, fill: "#ecc699" },
  { name: "Entertainment", value: 220, fill: "#f5d9b3" },
  { name: "Other", value: 148, fill: "#faecd0" },
];

const lineChartConfig = {
  expenses: {
    label: "Expenses",
    color: "#c96442",
  },
  income: {
    label: "Income",
    color: "#22c55e",
  },
};

const pieChartConfig = {
  Housing: { label: "Housing", color: "#c96442" },
  Food: { label: "Food", color: "#d4845f" },
  Transport: { label: "Transport", color: "#e0a57c" },
  Utilities: { label: "Utilities", color: "#ecc699" },
  Entertainment: { label: "Entertainment", color: "#f5d9b3" },
  Other: { label: "Other", color: "#faecd0" },
};

export function ExpenseCharts() {
  const total = expenseCategoryData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Line Chart - Takes 3 columns */}
      <Card className="bg-card border-border lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-foreground">Expense Trends</CardTitle>
          <CardDescription className="text-muted-foreground">
            Monthly expenses vs income over the past 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig} className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={expenseTrendData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                  className="text-muted-foreground"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-medium">
                          ${Number(value).toLocaleString()}
                        </span>
                      )}
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
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="var(--color-expenses)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-expenses)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Pie Chart - Takes 2 columns */}
      <Card className="bg-card border-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-foreground">Expenses by Category</CardTitle>
          <CardDescription className="text-muted-foreground">
            Breakdown of your spending this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieChartConfig} className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-medium">
                          ${Number(value).toLocaleString()} (
                          {((Number(value) / total) * 100).toFixed(1)}%)
                        </span>
                      )}
                    />
                  }
                />
                <Pie
                  data={expenseCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {expenseCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ paddingLeft: "20px" }}
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}