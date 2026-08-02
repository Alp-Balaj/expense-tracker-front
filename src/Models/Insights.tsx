// Matches the backend's InsightsDTO (GET /api/Insights): the current month
// measured against the previous three, overall and per category. Amounts are
// already converted into the user's base currency server-side.

export type CategoryInsight = {
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  currentMonthTotal: number;
  previousMonthTotal: number;
  /** Current minus previous month — the size of the move, in base currency. */
  momChangeAmount: number;
  /** Month-over-month change in percent; null when last month was zero. */
  momChangePct: number | null;
  /** Average over the previous three months; null on a cold start. */
  trailingAverage: number | null;
  /** Current month vs the trailing average, in percent; null on a cold start. */
  vsAveragePct: number | null;
};

export type Insights = {
  /** The month the insights describe, as yyyy-MM. */
  month: string;
  baseCurrency: string | null;
  hasMissingRates: boolean;
  /** Of the three months before this one, how many contain any expense. */
  monthsWithHistory: number;
  currentMonthTotal: number;
  previousMonthTotal: number;
  trailingAverage: number | null;
  overallVsAveragePct: number | null;
  /** Biggest month-over-month movers first. */
  categories: CategoryInsight[];
};
