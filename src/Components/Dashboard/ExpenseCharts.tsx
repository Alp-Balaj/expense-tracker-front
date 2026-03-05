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
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/Components/ui/chart"
import type { Expense } from "@/Models/Expense"
import type { Category } from "@/Models/Category"

interface ExpenseChartsProps {
  expenses: Expense[]
  categories: Category[]
}

const FALLBACK_COLORS = [
  "#c96442",
  "#d4845f",
  "#e0a57c",
  "#ecc699",
  "#f5d9b3",
  "#faecd0",
  "#8b5cf6",
  "#14b8a6",
]

function formatEur(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

export function ExpenseCharts({ expenses, categories }: ExpenseChartsProps) {
  // Build monthly trend data for the last 6 months
  const now = new Date()
  const monthLabels: string[] = []
  const monthKeys: string[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthLabels.push(d.toLocaleDateString("en-US", { month: "short" }))
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`)
  }

  const trendData = monthLabels.map((label, idx) => {
    const key = monthKeys[idx]
    const total = expenses
      .filter((exp) => {
        const d = exp.date instanceof Date ? exp.date : new Date(exp.date as string)
        return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}` === key
      })
      .reduce((sum, exp) => sum + exp.amount, 0)

    return { month: label, expenses: total }
  })

  const lineChartConfig = {
    expenses: {
      label: "Expenses",
      color: "#c96442",
    },
  }

  // Build category breakdown for current month
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const currentMonthExpenses = expenses.filter((exp) => {
    const d = exp.date instanceof Date ? exp.date : new Date(exp.date as string)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  const categoryTotals: Record<string, { name: string; value: number; fill: string }> = {}
  let colorIdx = 0
  for (const exp of currentMonthExpenses) {
    const cat = categoryMap.get(exp.categoryId)
    const catName = cat?.name ?? "Uncategorized"
    const catColor = cat?.color || FALLBACK_COLORS[colorIdx % FALLBACK_COLORS.length]

    if (!categoryTotals[exp.categoryId]) {
      categoryTotals[exp.categoryId] = {
        name: catName,
        value: 0,
        fill: catColor,
      }
      colorIdx++
    }
    categoryTotals[exp.categoryId].value += exp.amount
  }

  const pieData = Object.values(categoryTotals).sort((a, b) => b.value - a.value)
  const pieTotal = pieData.reduce((sum, d) => sum + d.value, 0)

  const pieChartConfig: Record<string, { label: string; color: string }> = {}
  for (const entry of pieData) {
    pieChartConfig[entry.name] = { label: entry.name, color: entry.fill }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Line Chart - 3 columns */}
      <Card className="bg-card border-border lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-foreground">Expense Trends</CardTitle>
          <CardDescription className="text-muted-foreground">
            Monthly expenses over the past 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig} className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
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
                  tickFormatter={(value) => formatEur(value)}
                  className="text-muted-foreground"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-medium">
                          {formatEur(Number(value))}
                        </span>
                      )}
                    />
                  }
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

      {/* Pie Chart - 2 columns */}
      <Card className="bg-card border-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-foreground">Expenses by Category</CardTitle>
          <CardDescription className="text-muted-foreground">
            Breakdown of your spending this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px]">
              <p className="text-sm text-muted-foreground">
                No expense data for this month.
              </p>
            </div>
          ) : (
            <ChartContainer config={pieChartConfig} className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <span className="font-medium">
                            {formatEur(Number(value))} (
                            {((Number(value) / pieTotal) * 100).toFixed(1)}%)
                          </span>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry, index) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}