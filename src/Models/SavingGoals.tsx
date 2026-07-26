export type SavingContributions = {
  id: string
  goalId: string
  amount: number
  date: string
  note: string
}

export type SavingGoals = {
  id: string | null
  title: string
  targetAmount: number
  savedAmount: number
  deadline: string
  description: string
  accountId: string
  categoryId: string
  contributions: SavingContributions[]
}

export type AddSavingsGoal = Omit<SavingGoals, "contributions" | "savedAmount"> & {
  savedAmount?: number
}
