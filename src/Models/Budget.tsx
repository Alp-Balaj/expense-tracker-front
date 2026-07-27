/** Raw spend for one currency, before conversion into the base currency. */
export type CurrencySubtotal = {
  currency: string;
  total: number;
};

export const BudgetPeriod = {
  Monthly: 0,
} as const;

export type BudgetPeriod = (typeof BudgetPeriod)[keyof typeof BudgetPeriod];

export type Budget = {
  id: string | null;
  amount: number;
  period: BudgetPeriod;
  note: string | null;
  /** null = the overall budget across every expense category. */
  categoryId: string | null;
};

export type AddBudget = Budget;

/** One budget measured against a single month's spend (GET /api/Budget/status). */
export type BudgetStatus = {
  id: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string | null;
  note: string | null;
  period: BudgetPeriod;
  /** The month the status was computed for, as yyyy-MM. */
  month: string;
  limit: number;
  spent: number;
  /** Negative once the budget is overspent. */
  remaining: number;
  /** Uncapped, so overspend reads above 100. */
  percentUsed: number;
  baseCurrency: string | null;
  subtotals: CurrencySubtotal[];
  /** True when a rate was missing, so `spent` understates the real spend. */
  hasMissingRates: boolean;
};
