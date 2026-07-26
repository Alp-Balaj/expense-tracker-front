import { useState } from "react"
import { PiggyBank } from "lucide-react"
import { PageHeader } from "@/Components/General/PageHeader"
import { SavingsHeroCard } from "@/Components/Saving/SavingsHeroCard"
import { SavingsAchievementCard } from "@/Components/Saving/SavingsAchievementCard"
import { SavingsGoalGrid } from "@/Components/Saving/SavingsGoalGrid"
import SavingsGoalFormModal from "@/Components/Saving/SavingsGoalFormModal"
import type { SavingGoals, AddSavingsGoal, SavingContributions } from "@/Models/SavingGoals"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/errors"
import {
  useSavingGoalsQuery,
  useCreateSavingGoal,
  useUpdateSavingGoal,
  useDeleteSavingGoal,
  useAddSavingContribution,
} from "@/Hooks/queries/useSavingGoals"

function SavingPage() {
  const { data: goals = [] } = useSavingGoalsQuery()
  const createGoal = useCreateSavingGoal()
  const updateGoal = useUpdateSavingGoal()
  const deleteGoalMutation = useDeleteSavingGoal()
  const addContribution = useAddSavingContribution()

  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingGoals | null>(null)

  // --- Handlers -----------------------------------------------------
  const handleNewGoal = () => {
    setEditingGoal(null)
    setFormOpen(true)
  }

  const handleEditGoal = (goal: SavingGoals) => {
    setEditingGoal(goal)
    setFormOpen(true)
  }

  const handleSubmitGoal = async (data: AddSavingsGoal) => {
    try {
      if (editingGoal) await updateGoal.mutateAsync(data)
      else await createGoal.mutateAsync(data)
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to save goal."))
      throw e // the modal keeps the dialog open so the user can retry
    }
    toast.success(editingGoal ? "Goal updated" : "Goal added")
    setFormOpen(false)
    setEditingGoal(null)
  }

  const handleDeleteGoal = async (goal: SavingGoals) => {
    try {
      await deleteGoalMutation.mutateAsync(goal)
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to delete goal."))
      return
    }
    toast.success("Goal deleted")
  }

  const handleAddContribution = async (
    goalId: string,
    contribution: SavingContributions
  ) => {
    try {
      await addContribution.mutateAsync({ goalId, contribution })
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to add contribution."))
      return
    }
    toast.success("Contribution added")
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Savings"
        icon={<PiggyBank className="h-5 w-5 text-green-600 dark:text-green-400" />}
      />

      <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Hero + Achievement row */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SavingsHeroCard goals={goals} onNewGoal={handleNewGoal} />
          </div>
          <div className="lg:col-span-1">
            <SavingsAchievementCard goals={goals} />
          </div>
        </div>

        {/* Goal Cards */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Your Goals
          </h2>
          <SavingsGoalGrid
            goals={goals}
            onEdit={handleEditGoal}
            onDelete={handleDeleteGoal}
            onAddContribution={handleAddContribution}
          />
        </div>
      </main>

      {/* Form modal */}
      <SavingsGoalFormModal
        row={editingGoal}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmitGoal}
        onCancel={() => {
          setFormOpen(false)
          setEditingGoal(null)
        }}
      />
    </div>
  )
}

export default SavingPage
