import { TrendingUp, Wallet, Calendar, DollarSign } from "lucide-react"
import { SummaryCards } from "@/Components/Dashboard/SummaryCards"
import type { Income } from "@/Models/Income"

interface IncomeSummaryCardsProps {
  incomes: Income[]
}

function formatEur(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

export function IncomeSummaryCards({ incomes }: IncomeSummaryCardsProps) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const isInMonth = (date: unknown, month: number, year: number) => {
    const d = date instanceof Date ? date : new Date(date as string)
    return d.getMonth() === month && d.getFullYear() === year
  }

  const currentMonthIncomes = incomes.filter((i) =>
    isInMonth(i.date, currentMonth, currentYear)
  )
  const prevMonthIncomes = incomes.filter((i) =>
    isInMonth(i.date, prevMonth, prevYear)
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
    .filter((i) => {
      const d = i.date instanceof Date ? i.date : new Date(i.date as string)
      return d.getFullYear() === currentYear
    })
    .reduce((sum, i) => sum + i.amount, 0)

  const cards = [
    {
      title: "Monthly Income",
      value: formatEur(currentTotal),
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
