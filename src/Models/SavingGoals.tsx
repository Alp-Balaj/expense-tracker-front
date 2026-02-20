export type SavingContributions = {
  id: string
  goalId: string
  amount: number
  date: Date
  note: string
}

export type SavingGoals = {
  id: string | null
  title: string
  targetAmount: number
  savedAmount: number
  deadline: Date
  description: string
  accountId: string
  categoryId: string
  contributions: SavingContributions[]
}

export type AddSavingsGoal = Omit<SavingGoals, "contributions" | "savedAmount"> & {
  savedAmount?: number
}
