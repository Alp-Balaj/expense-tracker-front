import { useResourceQuery, useCreateResource, useUpdateResource, useDeleteResource } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import { BUDGET_API } from "@/Services/api";
import type { AddBudget, Budget, BudgetStatus } from "@/Models/Budget";

// Editing a budget changes its status too, so writes refresh both keys.
const DEPENDANTS = [queryKeys.budgetStatusRoot];

export const useBudgetsQuery = () => useResourceQuery<Budget>(queryKeys.budgets, BUDGET_API);
export const useCreateBudget = () => useCreateResource<AddBudget>(queryKeys.budgets, BUDGET_API, DEPENDANTS);
export const useUpdateBudget = () => useUpdateResource<AddBudget>(queryKeys.budgets, BUDGET_API, DEPENDANTS);
export const useDeleteBudget = () => useDeleteResource<Budget>(queryKeys.budgets, BUDGET_API, DEPENDANTS);

/**
 * Budgets evaluated against one month's spend.
 * @param month the month to evaluate, as `yyyy-MM`.
 */
export const useBudgetStatusQuery = (month: string) =>
  useResourceQuery<BudgetStatus>(
    queryKeys.budgetStatus(month),
    `${BUDGET_API}/status?month=${month}`
  );
