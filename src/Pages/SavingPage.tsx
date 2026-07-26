import { useCallback, useEffect, useState } from "react"
import { PiggyBank } from "lucide-react"
import { PageHeader } from "@/Components/General/PageHeader"
import { SavingsHeroCard } from "@/Components/Saving/SavingsHeroCard"
import { SavingsAchievementCard } from "@/Components/Saving/SavingsAchievementCard"
import { SavingsGoalGrid } from "@/Components/Saving/SavingsGoalGrid"
import SavingsGoalFormModal from "@/Components/Saving/SavingsGoalFormModal"
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi"
import type {
  SavingGoals,
  AddSavingsGoal,
  SavingContributions,
} from "@/Models/SavingGoals"
import { useAuth } from "@/Authorization/AuthContext"
import { SAVING_GOAL_API } from "@/Services/api"
import type { AxiosError } from "axios"

function SavingPage() {
  const { accessToken, isAuthReady } = useAuth()
  const { getAllData, postData, putData, deleteData } = useAuthorizationApi()

  const [goals, setGoals] = useState<SavingGoals[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingGoals | null>(null)

  const fetchGoals = useCallback(async () => {
    try {
      const data = await getAllData<SavingGoals[]>(SAVING_GOAL_API)
      setGoals(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      const err = e as AxiosError
      if (err.response?.status !== 401 && err.response?.status !== 404) {
        console.error(err)
      }
    }
  }, [getAllData])

  useEffect(() => {
    if (!isAuthReady || !accessToken) return
    fetchGoals()
  }, [isAuthReady, accessToken, fetchGoals])

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
      if (editingGoal) {
        await putData(SAVING_GOAL_API, data as SavingGoals)
      } else {
        await postData(SAVING_GOAL_API, data)
      }
      await fetchGoals()
      setFormOpen(false)
      setEditingGoal(null)
    } catch (e) {
      // Keep the dialog open so the user can retry
      console.error(e)
    }
  }

  const handleDeleteGoal = async (goal: SavingGoals) => {
    try {
      await deleteData(SAVING_GOAL_API, goal as SavingGoals & { id: string })
      setGoals((prev) => prev.filter((g) => g.id !== goal.id))
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddContribution = async (
    goalId: string,
    contribution: SavingContributions
  ) => {
    try {
      await postData(`api/SavingContribution/${goalId}`, contribution)
      await fetchGoals()
    } catch (e) {
      console.error(e)
    }
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
