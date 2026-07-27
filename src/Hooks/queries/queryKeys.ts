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
  futureExpenses: ["futureExpenses"] as const,
  savingGoals: ["savingGoals"] as const,
  transfers: ["transfers"] as const,
};
