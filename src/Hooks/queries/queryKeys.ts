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
  /**
   * Cycle U. The list, and one entry per pot for each of its three sub-reads —
   * so joining a pot refetches that pot's members without disturbing another
   * pot's activity log that is also on screen.
   */
  pots: ["pots"] as const,
  pot: (id: string) => ["pots", id] as const,
  potMembers: (id: string) => ["pots", id, "members"] as const,
  potInvites: (id: string) => ["pots", id, "invites"] as const,
  potActivity: (id: string) => ["pots", id, "activity"] as const,
  /** W2: balance, positions and the money feed — one key, because it is one read. */
  potLedger: (id: string) => ["pots", id, "ledger"] as const,
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
