import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Star, Target, CheckCircle, Wallet, PiggyBank } from "lucide-react"
import type { SavingGoals } from "@/Models/SavingGoals"

interface SavingsAchievementCardProps {
  goals: SavingGoals[]
}

function formatEur(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

export function SavingsAchievementCard({ goals }: SavingsAchievementCardProps) {
  const totalGoals = goals.length
  const completed = goals.filter(
    (g) => g.savedAmount >= g.targetAmount
  ).length
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0)

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
      value: formatEur(totalTarget),
      icon: Wallet,
    },
    {
      label: "Total Saved",
      value: formatEur(totalSaved),
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
