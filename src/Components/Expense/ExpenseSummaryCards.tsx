import { TrendingDown, Wallet, Calendar, DollarSign } from "lucide-react"
import { SummaryCards } from "@/Components/Dashboard/SummaryCards"
import type { Expense } from "@/Models/Expense"
import { useCurrency } from "@/Hooks/useCurrency"
import { monthKey } from "@/lib/dates"
import {
  filterByPeriod,
  periodLabel,
  precedingPeriod,
  resolvePeriod,
  type Period,
} from "@/lib/period"

interface ExpenseSummaryCardsProps {
  /** Full history — the cards filter it themselves, because the comparison
   *  card needs the window *before* the selected period too. */
  expenses: Expense[]
  period?: Period
}

export function ExpenseSummaryCards({
  expenses,
  period = resolvePeriod("thisMonth"),
}: ExpenseSummaryCardsProps) {
  const { format, userCurrencyCode } = useCurrency()
  const currentYear = new Date().getFullYear()

  const inPeriod = filterByPeriod(expenses, period)
  const previous = precedingPeriod(period)
  const inPrevious = previous ? filterByPeriod(expenses, previous) : []

  const currentTotal = inPeriod.reduce((sum, e) => sum + e.amount, 0)
  const prevTotal = inPrevious.reduce((sum, e) => sum + e.amount, 0)

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

  const entryCount = inPeriod.length

  const avgPerEntry = entryCount > 0 ? currentTotal / entryCount : 0

  const ytdTotal = expenses
    .filter((e) => monthKey(e.date).startsWith(String(currentYear)))
    .reduce((sum, e) => sum + e.amount, 0)

  const label = periodLabel(period)

  const cards = [
    {
      title: "Expenses",
      value: format(currentTotal, userCurrencyCode),
      // "All time" has no window before it to compare against.
      change: previous ? `${changePrefix}${percentChange}% vs previous` : label,
      changeType: previous ? changeType : ("neutral" as const),
      icon: TrendingDown,
    },
    {
      title: "Entries",
      value: String(entryCount),
      change: label,
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
