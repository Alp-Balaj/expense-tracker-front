import { TrendingDown, Wallet, Calendar, DollarSign } from "lucide-react"
import { SummaryCards } from "@/Components/Dashboard/SummaryCards"
import type { Expense } from "@/Models/Expense"
import { useCurrency } from "@/Hooks/useCurrency"
import { monthKey, monthKeyFromNow } from "@/lib/dates"

interface ExpenseSummaryCardsProps {
  expenses: Expense[]
}

export function ExpenseSummaryCards({ expenses }: ExpenseSummaryCardsProps) {
  const { format, userCurrencyCode } = useCurrency()
  const currentYear = new Date().getFullYear()

  const currentMonthExpenses = expenses.filter(
    (e) => monthKey(e.date) === monthKeyFromNow(0)
  )
  const prevMonthExpenses = expenses.filter(
    (e) => monthKey(e.date) === monthKeyFromNow(1)
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
    .filter((e) => monthKey(e.date).startsWith(String(currentYear)))
    .reduce((sum, e) => sum + e.amount, 0)

  const cards = [
    {
      title: "Monthly Expenses",
      value: format(currentTotal, userCurrencyCode),
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
      value: format(avgPerEntry, userCurrencyCode),
      change: `from ${entryCount} entries`,
      changeType: "neutral" as const,
      icon: Wallet,
    },
    {
      title: "Year-to-Date",
      value: format(ytdTotal, userCurrencyCode),
      change: `${currentYear} total`,
      changeType: "neutral" as const,
      icon: DollarSign,
    },
  ]

  return <SummaryCards cards={cards} />
}