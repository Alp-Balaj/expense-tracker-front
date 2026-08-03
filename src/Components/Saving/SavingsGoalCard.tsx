import { useMemo, useState } from "react"
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
  AlertTriangle,
} from "lucide-react"
import type { SavingGoals, SavingContributions } from "@/Models/SavingGoals"
import { SavingsGoalProgressRing } from "./SavingsGoalProgressRing"
import SavingContributionsModal from "./SavingContributionsModal"
import { useCurrency } from "@/Hooks/useCurrency"
import { useAccountsQuery } from "@/Hooks/queries/useAccounts"
import { parseISO } from "date-fns"
import { toISODate } from "@/lib/dates"

interface SavingsGoalCardProps {
  goal: SavingGoals
  onEdit: (goal: SavingGoals) => void
  onDelete: (goal: SavingGoals) => void
  onAddContribution: (
    goalId: string,
    contribution: SavingContributions
  ) => void | Promise<void>
}

function formatDate(d: string): string {
  // parseISO reads "yyyy-MM-dd" as local midnight — no timezone shift.
  const date = parseISO(toISODate(d))
  return date.toLocaleDateString(undefined, {
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
  const { formatOriginal, userCurrencyCode } = useCurrency()
  const { data: accounts = [] } = useAccountsQuery()

  // A goal is denominated in the currency of the account its money sits in;
  // until it holds any, there is nothing to denominate and the user's base
  // currency is the honest placeholder.
  const goalCurrency = goal.currencyCode ?? userCurrencyCode
  const money = (amount: number) => formatOriginal(amount, goalCurrency)

  const percentage =
    goal.targetAmount > 0
      ? (goal.savedAmount / goal.targetAmount) * 100
      : 0
  const isCompleted = goal.savedAmount >= goal.targetAmount
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)

  const deadline = toISODate(goal.deadline)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = parseISO(deadline)

  const daysLeft = Math.max(
    0,
    Math.ceil((target.getTime() - today.getTime()) / 86400000)
  )

  const sortedContribs = [...(goal.contributions ?? [])].sort((a, b) =>
    toISODate(b.date).localeCompare(toISODate(a.date))
  )

  // Where the money actually sits. A goal is virtual, but every euro of it is
  // reserved against a real account, and several accounts can back one goal —
  // so the card names them rather than leaving the total unaddressed.
  const perAccount = useMemo(() => {
    const totals = new Map<string, number>()
    for (const c of goal.contributions ?? []) {
      // Contributions predating Stream V carry no account; they still count
      // toward the goal, they just have no address to show.
      const key = c.accountId ?? ""
      totals.set(key, (totals.get(key) ?? 0) + c.amount)
    }
    return [...totals.entries()]
      // A released-to-zero account is no longer holding anything for the goal.
      .filter(([, amount]) => amount !== 0)
      .map(([id, amount]) => {
        const account = accounts.find((a) => a.id === id)
        return { id, account, name: account?.name ?? "Unassigned", amount }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [goal.contributions, accounts])

  // Reserved money that has since been spent. Nothing in the data says which
  // goal was dipped into, so every goal holding money in the account is warned
  // rather than inventing an allocation of the shortfall.
  const overReservedNames = perAccount
    .filter(({ account }) => account && account.reservedAmount > account.balance)
    .map(({ name }) => name)

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
                  {money(goal.savedAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  of your {money(goal.targetAmount)} goal
                </p>
              </div>

              <Separator className="my-2" />

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium text-foreground">
                  {money(remaining)}
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

          {/* Where the reserved money is held */}
          {perAccount.length > 0 && (
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
              {perAccount.map(({ id, name, amount }, i) => (
                <span key={id} className="whitespace-nowrap">
                  {i > 0 && <span className="mr-1.5">·</span>}
                  <span className="text-foreground">{name}</span>{" "}
                  <span className="font-medium tabular-nums">{money(amount)}</span>
                </span>
              ))}
            </p>
          )}

          {overReservedNames.length > 0 && (
            <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                {overReservedNames.join(", ")}{" "}
                {overReservedNames.length === 1 ? "holds" : "hold"} less than
                savings goals have reserved — some of this money has already been
                spent.
              </span>
            </p>
          )}

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
                  const cd = c.date
                  // A negative contribution is money taken back out; showing it
                  // as "+ -50" in green would read as the opposite of what it is.
                  const released = c.amount < 0
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
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          released
                            ? "text-muted-foreground"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {released ? "−" : "+"} {money(Math.abs(c.amount))}
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
        goal={goal}
        open={contribOpen}
        onOpenChange={setContribOpen}
        onSubmit={(c) => onAddContribution(goal.id ?? "", c)}
      />
    </>
  )
}
