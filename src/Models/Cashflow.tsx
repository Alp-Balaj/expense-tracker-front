// Matches the backend's CashflowProjectionDTO (GET /api/Cashflow/projection):
// the liquid balance walked forward day by day over the next month, in the
// user's base currency.

export type CashflowPoint = {
  /** yyyy-MM-dd. */
  date: string;
  /** The projected liquid balance at the end of this day. */
  projectedBalance: number;
  /** Planned bills applied on this day, positive = money out. */
  plannedOutflow: number;
  plannedInflow: number;
};

export type CashflowProjection = {
  /** The month the projection starts in, as yyyy-MM. */
  month: string;
  baseCurrency: string | null;
  hasMissingRates: boolean;
  /** yyyy-MM-dd; the first point's date. */
  today: string;
  /** yyyy-MM-dd; the last day of the current month. */
  endOfMonth: string;
  /** Checking + savings + cash right now, converted. */
  startingBalance: number;
  /** Estimated everyday spend per day, excluding planned bills. */
  dailyBurnRate: number;
  projectedEndOfMonthBalance: number;
  /** The balance at the end of the 30-day window. */
  projectedEndBalance: number;
  /** One point per day, today + 30 days inclusive. */
  points: CashflowPoint[];
};
