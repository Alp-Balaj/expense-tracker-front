import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card"
import { Button } from "@/Components/ui/button"
import { Badge } from "@/Components/ui/badge"
import { Separator } from "@/Components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"
import {
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react"
import type { SavingGoals, SavingContributions } from "@/Models/SavingGoals"
import { SavingsGoalProgressRing } from "./SavingsGoalProgressRing"
import SavingContributionsModal from "./SavingContributionsModal"

interface SavingsGoalCardProps {
  goal: SavingGoals
  onEdit: (goal: SavingGoals) => void
  onDelete: (goal: SavingGoals) => void
  onAddContribution: (goalId: string, contribution: SavingContributions) => void
}

function formatEur(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

function formatDate(d: Date): string {
  const date = d instanceof Date ? d : new Date(d as unknown as string)
  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export function SavingsGoalCard({
  goal,
  onEdit,
  onDelete,
  onAddContribution,
}: SavingsGoalCardProps) {
  const [contribOpen, setContribOpen] = useState(false)
  
  const percentage =
    goal.targetAmount > 0
      ? (goal.savedAmount / goal.targetAmount) * 100
      : 0
  const isCompleted = goal.savedAmount >= goal.targetAmount
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)

  const deadline =
  goal.deadline instanceof Date
    ? goal.deadline
    : new Date(goal.deadline as unknown as string)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(deadline)
  target.setHours(0, 0, 0, 0)

  const daysLeft = Math.max(
    0,
    Math.ceil((target.getTime() - today.getTime()) / 86400000)
  )

  const sortedContribs = [...(goal.contributions ?? [])].sort((a, b) => {
    const da = a.date instanceof Date ? a.date : new Date(a.date as unknown as string)
    const db = b.date instanceof Date ? b.date : new Date(b.date as unknown as string)
    return db.getTime() - da.getTime()
  })

  return (
    <>
      <Card
        className={`relative overflow-hidden transition-all hover:shadow-lg ${
          isCompleted
            ? "border-green-500/50 bg-gradient-to-br from-green-500/5 to-emerald-500/5"
            : "border-border bg-card"
        }`}
      >
        {/* Top green accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, #22c55e ${Math.min(percentage, 100)}%, transparent ${Math.min(percentage, 100)}%)`,
          }}
        />

        <CardHeader className="flex flex-row items-start justify-between pt-5 pb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-foreground text-base truncate">
                {goal.title}
              </CardTitle>
              {isCompleted && (
                <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 text-xs shrink-0">
                  Completed
                </Badge>
              )}
            </div>
            {goal.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {goal.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 shrink-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(goal)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress ring + amount info */}
          <div className="flex items-center gap-6">
            <SavingsGoalProgressRing
              percentage={percentage}
              size={130}
              strokeWidth={10}
              label="saved"
            />

            <div className="flex-1 space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">You have reached</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatEur(goal.savedAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  of your {formatEur(goal.targetAmount)} goal
                </p>
              </div>

              <Separator className="my-2" />

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium text-foreground">
                  {formatEur(remaining)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Deadline
                </span>
                <span className="font-medium text-foreground">
                  {formatDate(deadline)}
                  {!isCompleted && (
                    <span className="text-muted-foreground ml-1">
                      ({daysLeft}d left)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Contributions section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Payments
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setContribOpen(true)}
                className="h-7 px-2 text-xs text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-green-500/10"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>

            {sortedContribs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                No contributions yet.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {sortedContribs.slice(0, 5).map((c) => {
                  const cd = c.date instanceof Date
                    ? c.date
                    : new Date(c.date as unknown as string)
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(cd)}
                        </span>
                        {c.note && (
                          <span className="text-xs text-muted-foreground truncate">
                            {c.note}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400 shrink-0">
                        + {formatEur(c.amount)}
                      </span>
                    </div>
                  )
                })}
                {sortedContribs.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{sortedContribs.length - 5} more
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <SavingContributionsModal
        goalId={goal.id ?? ""}
        goalTitle={goal.title}
        open={contribOpen}
        onOpenChange={setContribOpen}
        onSubmit={(c) => onAddContribution(goal.id ?? "", c)}
      />
    </>
  )
}
