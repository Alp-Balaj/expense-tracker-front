export const queryKeys = {
  accounts: ["accounts"] as const,
  budgets: ["budgets"] as const,
  // Status is per-month, so each month gets its own cache entry under the
  // same root — invalidating ["budgetStatus"] refreshes every month in cache.
  budgetStatus: (month: string) => ["budgetStatus", month] as const,
  budgetStatusRoot: ["budgetStatus"] as const,
  categories: ["categories"] as const,
  currencies: ["currencies"] as const,
  expenses: ["expenses"] as const,
  incomes: ["incomes"] as const,
  plannedTransactions: ["plannedTransactions"] as const,
  /** Open receivables on split expenses. Expense writes can create or clear one. */
  reimbursements: ["reimbursements"] as const,
  /** The due queue. Separate from the templates: confirming one changes only this. */
  plannedOccurrences: ["plannedOccurrences"] as const,
  savingGoals: ["savingGoals"] as const,
  transfers: ["transfers"] as const,
  // Server-computed analytics: single objects, not lists. Writes to the data
  // they derive from list them as dependants, the same way budgetStatus works.
  insights: ["insights"] as const,
  cashflowProjection: ["cashflowProjection"] as const,
};
