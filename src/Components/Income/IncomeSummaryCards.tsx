import { TrendingUp, Wallet, Calendar, DollarSign } from "lucide-react"
import { SummaryCards } from "@/Components/Dashboard/SummaryCards"
import type { Income } from "@/Models/Income"
import { useCurrency } from "@/Hooks/useCurrency"
import { monthKey, monthKeyFromNow } from "@/lib/dates"

interface IncomeSummaryCardsProps {
  incomes: Income[]
}

export function IncomeSummaryCards({ incomes }: IncomeSummaryCardsProps) {
  const { format, userCurrencyCode } = useCurrency()
  const currentYear = new Date().getFullYear()

  const currentMonthIncomes = incomes.filter(
    (i) => monthKey(i.date) === monthKeyFromNow(0)
  )
  const prevMonthIncomes = incomes.filter(
    (i) => monthKey(i.date) === monthKeyFromNow(1)
  )

  const currentTotal = currentMonthIncomes.reduce((sum, i) => sum + i.amount, 0)
  const prevTotal = prevMonthIncomes.reduce((sum, i) => sum + i.amount, 0)

  const percentChange =
    prevTotal > 0
      ? (((currentTotal - prevTotal) / prevTotal) * 100).toFixed(1)
      : currentTotal > 0
        ? "+100"
        : "0"

  const changePrefix = Number(percentChange) >= 0 ? "+" : ""

  // Count of income entries this month
  const entryCount = currentMonthIncomes.length

  // Average income per entry this month
  const avgPerEntry = entryCount > 0 ? currentTotal / entryCount : 0

  // Year-to-date total
  const ytdTotal = incomes
    .filter((i) => monthKey(i.date).startsWith(String(currentYear)))
    .reduce((sum, i) => sum + i.amount, 0)

  const cards = [
    {
      title: "Monthly Income",
      value: format(currentTotal, userCurrencyCode),
      change: `${changePrefix}${percentChange}%`,
      changeType: Number(percentChange) >= 0 ? ("positive" as const) : ("negative" as const),
      icon: TrendingUp,
    },
    {
      title: "Entries This Month",
      value: String(entryCount),
      change: `${currentMonthIncomes.length} transactions`,
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
