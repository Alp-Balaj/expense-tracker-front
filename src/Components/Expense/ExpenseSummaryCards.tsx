import { TrendingDown, Wallet, Calendar, DollarSign } from "lucide-react"
import { SummaryCards } from "@/Components/Dashboard/SummaryCards"
import type { Expense } from "@/Models/Expense"

interface ExpenseSummaryCardsProps {
  expenses: Expense[]
}

function formatEur(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

export function ExpenseSummaryCards({ expenses }: ExpenseSummaryCardsProps) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const isInMonth = (date: unknown, month: number, year: number) => {
    const d = date instanceof Date ? date : new Date(date as string)
    return d.getMonth() === month && d.getFullYear() === year
  }

  const currentMonthExpenses = expenses.filter((e) =>
    isInMonth(e.date, currentMonth, currentYear)
  )
  const prevMonthExpenses = expenses.filter((e) =>
    isInMonth(e.date, prevMonth, prevYear)
  )

  const currentTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const prevTotal = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0)

  const percentChange =
    prevTotal > 0
      ? (((currentTotal - prevTotal) / prevTotal) * 100).toFixed(1)
      : currentTotal > 0
        ? "+100"
        : "0"

  const changePrefix = Number(percentChange) >= 0 ? "+" : ""

  // For expenses, an increase is negative (bad)
  const changeType: "positive" | "negative" | "neutral" =
    Number(percentChange) > 0 ? "negative" : Number(percentChange) < 0 ? "positive" : "neutral"

  const entryCount = currentMonthExpenses.length

  const avgPerEntry = entryCount > 0 ? currentTotal / entryCount : 0

  const ytdTotal = expenses
    .filter((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date as string)
      return d.getFullYear() === currentYear
    })
    .reduce((sum, e) => sum + e.amount, 0)

  const cards = [
    {
      title: "Monthly Expenses",
      value: formatEur(currentTotal),
      change: `${changePrefix}${percentChange}%`,
      changeType,
      icon: TrendingDown,
    },
    {
      title: "Entries This Month",
      value: String(entryCount),
      change: `${currentMonthExpenses.length} transactions`,
      changeType: "neutral" as const,
      icon: Calendar,
    },
    {
      title: "Avg. per Entry",
      value: formatEur(avgPerEntry),
      change: `from ${entryCount} entries`,
      changeType: "neutral" as const,
      icon: Wallet,
    },
    {
      title: "Year-to-Date",
      value: formatEur(ytdTotal),
      change: `${currentYear} total`,
      changeType: "neutral" as const,
      icon: DollarSign,
    },
  ]

  return <SummaryCards cards={cards} />
}