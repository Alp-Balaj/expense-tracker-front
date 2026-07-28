import { useMemo } from "react";

import { useExpensesQuery } from "@/Hooks/queries/useExpenses";
import {
  usePlannedOccurrencesQuery,
  usePlannedTransactionsQuery,
} from "@/Hooks/queries/usePlannedTransactions";
import { useBudgetStatusQuery } from "@/Hooks/queries/useBudgets";
import type { BudgetStatus } from "@/Models/Budget";
import {
  BUDGET_WARNING_THRESHOLD,
  currentMonth,
  formatMonth,
  overallBudgetStatus,
} from "@/lib/budget";
import { monthCursor, upcomingBills, type MonthCursor } from "@/lib/dashboard";

/** A bill or budget the bell wants to tell you about. */
export type NavAlert = {
  id: string;
  kind: "bill" | "budget";
  title: string;
  detail: string;
  amount: number;
  /** Overdue bills and overspent budgets read as urgent. */
  urgent: boolean;
  to: string;
};

export type NavIndicators = {
  /** Rows the "Expenses" nav item counts. */
  expenseCount: number;
  /** Whether "Budgets" shows its attention dot. */
  budgetAttention: boolean;
  /** What the "Planned" nav item counts: occurrences waiting to be confirmed. */
  plannedDue: number;
  /** The overall budget, for the sidebar's safe-to-spend block. Null when unset. */
  overallBudget: BudgetStatus | null;
  cursor: MonthCursor;
  /** "July" — the month the block describes. */
  monthLabel: string;
  isLoading: boolean;
  alerts: NavAlert[];
};

/** Bills further out than this are not worth a notification yet. */
const BILL_HORIZON_DAYS = 7;

/**
 * Everything the app chrome shows beyond the route itself: the counts and dots
 * on the nav rows, the sidebar's safe-to-spend figure, and the bell's list.
 *
 * The three queries behind it are the same cache entries the dashboard and the
 * expense pages already use, so mounting this in the shell costs no extra
 * requests once any of those pages has loaded.
 */
export function useNavIndicators(): NavIndicators {
  const month = currentMonth();

  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpensesQuery();
  const { data: occurrences = [] } = usePlannedOccurrencesQuery();
  const { data: plans = [] } = usePlannedTransactionsQuery();
  const { data: budgetStatuses = [], isLoading: isLoadingBudgets } =
    useBudgetStatusQuery(month);

  const overallBudget = useMemo(
    () => overallBudgetStatus(budgetStatuses),
    [budgetStatuses],
  );

  const budgetAttention = useMemo(
    () => budgetStatuses.some((status) => status.percentUsed > BUDGET_WARNING_THRESHOLD),
    [budgetStatuses],
  );

  const alerts = useMemo<NavAlert[]>(() => {
    const bills: NavAlert[] = upcomingBills(occurrences, plans)
      .filter((bill) => bill.daysUntil <= BILL_HORIZON_DAYS)
      .map((bill) => ({
        id: `bill-${bill.key}`,
        kind: "bill",
        title: bill.title,
        detail:
          bill.daysUntil < 0
            ? `Overdue by ${Math.abs(bill.daysUntil)}d`
            : bill.daysUntil === 0
              ? "Due today"
              : `Due in ${bill.daysUntil}d`,
        amount: bill.amount,
        urgent: bill.daysUntil <= 0,
        // The bell now leads somewhere you can actually act on it.
        to: "/planned",
      }));

    const budgets: NavAlert[] = budgetStatuses
      .filter((status) => status.percentUsed > BUDGET_WARNING_THRESHOLD)
      .sort((a, b) => b.percentUsed - a.percentUsed)
      .map((status) => ({
        id: `budget-${status.id}`,
        kind: "budget",
        title: status.categoryId === null ? "Overall budget" : status.categoryName,
        detail:
          status.percentUsed > 100
            ? `${Math.round(status.percentUsed)}% used · over by`
            : `${Math.round(status.percentUsed)}% of the ${formatMonth(status.month).split(" ")[0]} limit`,
        amount: status.percentUsed > 100 ? Math.abs(status.remaining) : status.remaining,
        urgent: status.percentUsed > 100,
        to: "/budgets",
      }));

    // Urgent first, then bills before budgets — the bill is the thing with a date.
    return [...bills, ...budgets].sort(
      (a, b) => Number(b.urgent) - Number(a.urgent),
    );
  }, [occurrences, plans, budgetStatuses]);

  const cursor = useMemo(() => monthCursor(month), [month]);

  return {
    expenseCount: expenses.length,
    budgetAttention,
    plannedDue: occurrences.length,
    overallBudget,
    cursor,
    monthLabel: formatMonth(month).split(" ")[0],
    isLoading: isLoadingExpenses || isLoadingBudgets,
    alerts,
  };
}
