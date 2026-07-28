import { TrendingUp, Wallet, Calendar, DollarSign } from "lucide-react"
import { SummaryCards } from "@/Components/Dashboard/SummaryCards"
import type { Income } from "@/Models/Income"
import { useCurrency } from "@/Hooks/useCurrency"
import { monthKey } from "@/lib/dates"
import {
  filterByPeriod,
  periodLabel,
  precedingPeriod,
  resolvePeriod,
  type Period,
} from "@/lib/period"

interface IncomeSummaryCardsProps {
  /** Full history — the cards filter it themselves, because the comparison
   *  card needs the window *before* the selected period too. */
  incomes: Income[]
  period?: Period
}

export function IncomeSummaryCards({
  incomes,
  period = resolvePeriod("thisMonth"),
}: IncomeSummaryCardsProps) {
  const { format, userCurrencyCode } = useCurrency()
  const currentYear = new Date().getFullYear()

  const inPeriod = filterByPeriod(incomes, period)
  const previous = precedingPeriod(period)
  const inPrevious = previous ? filterByPeriod(incomes, previous) : []

  const currentTotal = inPeriod.reduce((sum, i) => sum + i.amount, 0)
  const prevTotal = inPrevious.reduce((sum, i) => sum + i.amount, 0)

  const percentChange =
    prevTotal > 0
      ? (((currentTotal - prevTotal) / prevTotal) * 100).toFixed(1)
      : currentTotal > 0
        ? "+100"
        : "0"

  const changePrefix = Number(percentChange) >= 0 ? "+" : ""

  const entryCount = inPeriod.length

  const avgPerEntry = entryCount > 0 ? currentTotal / entryCount : 0

  // Year-to-date total
  const ytdTotal = incomes
    .filter((i) => monthKey(i.date).startsWith(String(currentYear)))
    .reduce((sum, i) => sum + i.amount, 0)

  const label = periodLabel(period)

  const cards = [
    {
      title: "Income",
      value: format(currentTotal, userCurrencyCode),
      // "All time" has no window before it to compare against.
      change: previous ? `${changePrefix}${percentChange}% vs previous` : label,
      changeType: !previous
        ? ("neutral" as const)
        : Number(percentChange) >= 0
          ? ("positive" as const)
          : ("negative" as const),
      icon: TrendingUp,
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
