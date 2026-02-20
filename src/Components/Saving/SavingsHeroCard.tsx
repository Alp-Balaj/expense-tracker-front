import { Card, CardContent } from "@/Components/ui/card"
import { Button } from "@/Components/ui/button"
import { PiggyBank, Plus, Trophy } from "lucide-react"
import { SavingsGoalProgressRing } from "./SavingsGoalProgressRing"
import type { SavingGoals } from "@/Models/SavingGoals"

interface SavingsHeroCardProps {
  goals: SavingGoals[]
  onNewGoal: () => void
}

function formatEur(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

export function SavingsHeroCard({ goals, onNewGoal }: SavingsHeroCardProps) {
  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0)
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const overallPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
  const completedCount = goals.filter((g) => g.savedAmount >= g.targetAmount).length

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 text-white shadow-xl">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row items-center gap-6 p-6 lg:p-8">
          {/* Left - Progress ring */}
          <div className="relative shrink-0">
            <div className="rounded-full bg-white/10 p-4 backdrop-blur-sm">
              <SavingsGoalProgressRing
                percentage={overallPercentage}
                size={150}
                strokeWidth={12}
              />
            </div>
          </div>

          {/* Center - Info */}
          <div className="flex-1 text-center lg:text-left space-y-3">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <PiggyBank className="h-5 w-5 text-white/80" />
              <p className="text-sm font-medium text-white/80 uppercase tracking-wider">
                Saved Money
              </p>
            </div>
            <p className="text-4xl font-bold tracking-tight">
              {formatEur(totalSaved)}
            </p>
            <p className="text-sm text-white/70">
              of {formatEur(totalTarget)} total goal across {goals.length}{" "}
              {goals.length === 1 ? "goal" : "goals"}
            </p>

            {completedCount > 0 && (
              <div className="flex items-center justify-center lg:justify-start gap-1.5 text-sm text-white/90">
                <Trophy className="h-4 w-4" />
                <span>
                  {completedCount} {completedCount === 1 ? "goal" : "goals"} completed
                </span>
              </div>
            )}
          </div>

          {/* Right - Action */}
          <div className="shrink-0 flex flex-col gap-3">
            <Button
              onClick={onNewGoal}
              size="lg"
              className="bg-white/20 text-white border border-white/30 hover:bg-white/30 backdrop-blur-sm h-12 px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </div>
        </div>

        {/* Decorative bottom plants (subtle) */}
        <div className="h-1 bg-gradient-to-r from-green-700 via-emerald-400 to-green-700 opacity-40" />
      </CardContent>
    </Card>
  )
}
