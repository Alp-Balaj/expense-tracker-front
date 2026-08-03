export type SavingContributions = {
  id: string
  goalId: string
  /** Signed: positive reserves money, negative releases it back. */
  amount: number
  date: string
  note: string
  /** The account this money is reserved against. Required on every write. */
  accountId: string | null
}

export type SavingGoals = {
  id: string | null
  title: string
  targetAmount: number
  savedAmount: number
  deadline: string
  description: string
  /**
   * The goal's original single backing account. Deprecated by Stream V — no
   * money math reads it; it survives as the account the contribution form
   * suggests first, and is null on goals created since.
   */
  accountId: string | null
  categoryId: string
  /**
   * The currency this goal is denominated in: that of its earliest
   * contribution's account, and the only currency further contributions may be
   * made in. Null while the goal is empty, when any account may fund it.
   */
  currencyCode: string | null
  contributions: SavingContributions[]
}

export type AddSavingsGoal = Omit<
  SavingGoals,
  "contributions" | "savedAmount" | "currencyCode"
> & {
  savedAmount?: number
}
