import type { SavingGoals, SavingContributions } from "@/Models/SavingGoals"
import { SavingsGoalCard } from "./SavingsGoalCard"

interface SavingsGoalGridProps {
  goals: SavingGoals[]
  onEdit: (goal: SavingGoals) => void
  onDelete: (goal: SavingGoals) => void
  onAddContribution: (goalId: string, contribution: SavingContributions) => void
}

export function SavingsGoalGrid({
  goals,
  onEdit,
  onDelete,
  onAddContribution,
}: SavingsGoalGridProps) {
  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          No savings goals yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create your first savings goal to start tracking your progress toward
          financial freedom.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {goals.map((goal) => (
        <SavingsGoalCard
          key={goal.id}
          goal={goal}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddContribution={onAddContribution}
        />
      ))}
    </div>
  )
}
