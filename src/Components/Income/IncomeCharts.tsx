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
import type { Income } from "@/Models/Income"
import type { Category } from "@/Models/Category"
import { useCurrency } from "@/Hooks/useCurrency"
import { monthKey } from "@/lib/dates"
import {
  filterByPeriod,
  periodLabel,
  resolvePeriod,
  trendMonths,
  type Period,
} from "@/lib/period"

interface IncomeChartsProps {
  /** Full history — the trend needs months either side of the selection. */
  incomes: Income[]
  categories: Category[]
  period?: Period
}

const FALLBACK_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
]

function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return String(Math.round(value))
}

export function IncomeCharts({
  incomes,
  categories,
  period = resolvePeriod("thisMonth"),
}: IncomeChartsProps) {
  const { format, userCurrencyCode } = useCurrency()

  // The trend window follows the selected period rather than always ending at
  // the current month, so "Last month" slides it back a month.
  const chartMonths = trendMonths(period)

  const trendData = chartMonths.map((key) => {
    const [year, month] = key.split("-").map(Number)
    const label = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: "short",
    })
    const total = incomes
      .filter((inc) => monthKey(inc.date) === key)
      .reduce((sum, inc) => sum + inc.amount, 0)

    return { month: label, income: total }
  })

  const lineChartConfig = {
    income: {
      label: "Income",
      color: "#22c55e",
    },
  }

  // Build category breakdown for the selected period
  const periodIncomes = filterByPeriod(incomes, period)

  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  const categoryTotals: Record<string, { name: string; value: number; fill: string }> = {}
  let colorIdx = 0
  for (const inc of periodIncomes) {
    const cat = categoryMap.get(inc.categoryId)
    const catName = cat?.name ?? "Uncategorized"
    const catColor = cat?.color || FALLBACK_COLORS[colorIdx % FALLBACK_COLORS.length]

    if (!categoryTotals[inc.categoryId]) {
      categoryTotals[inc.categoryId] = {
        name: catName,
        value: 0,
        fill: catColor,
      }
      colorIdx++
    }
    categoryTotals[inc.categoryId].value += inc.amount
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
          <CardTitle className="text-foreground">Income Trends</CardTitle>
          <CardDescription className="text-muted-foreground">
            Monthly income over the past {chartMonths.length} months
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
                  tickFormatter={(value: number) => compactNumber(value)}
                  className="text-muted-foreground"
                  width={40}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-medium">
                          {format(Number(value), userCurrencyCode)}
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
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Pie Chart - 2 columns */}
      <Card className="bg-card border-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-foreground">Income by Category</CardTitle>
          <CardDescription className="text-muted-foreground">
            Breakdown of your income — {periodLabel(period).toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px]">
              <p className="text-sm text-muted-foreground">
                No income data for this month.
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
                            {format(Number(value), userCurrencyCode)} (
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
