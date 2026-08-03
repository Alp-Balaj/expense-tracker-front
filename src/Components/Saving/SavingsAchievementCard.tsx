import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Star, Target, CheckCircle, Wallet, PiggyBank } from "lucide-react"
import type { SavingGoals } from "@/Models/SavingGoals"
import { useCurrency } from "@/Hooks/useCurrency"

interface SavingsAchievementCardProps {
  goals: SavingGoals[]
}

export function SavingsAchievementCard({ goals }: SavingsAchievementCardProps) {
  const { convert, format, userCurrencyCode } = useCurrency()
  const totalGoals = goals.length
  const completed = goals.filter(
    (g) => g.savedAmount >= g.targetAmount
  ).length
  // Each goal carries its own currency, so the cross-goal totals are converted
  // per goal before being added rather than summed as raw numbers.
  const inBase = (amount: number, goal: SavingGoals) =>
    convert(amount, goal.currencyCode ?? userCurrencyCode)
  const totalTarget = goals.reduce((sum, g) => sum + inBase(g.targetAmount, g), 0)
  const totalSaved = goals.reduce((sum, g) => sum + inBase(g.savedAmount, g), 0)

  const stats = [
    {
      label: "Goals",
      value: String(totalGoals),
      icon: Target,
    },
    {
      label: "Completed",
      value: String(completed),
      icon: CheckCircle,
    },
    {
      label: "Total Target",
      value: format(totalTarget, userCurrencyCode),
      icon: Wallet,
    },
    {
      label: "Total Saved",
      value: format(totalSaved, userCurrencyCode),
      icon: PiggyBank,
    },
  ]

  return (
    <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-foreground text-lg">Achievement</CardTitle>
        <Star className="h-5 w-5 text-green-500 fill-green-500" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/15">
                <stat.icon className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
