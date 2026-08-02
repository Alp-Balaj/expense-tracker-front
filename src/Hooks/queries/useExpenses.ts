import { useResourceQuery, useCreateResource, useUpdateResource, useDeleteResource } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import type { Expense } from "@/Models/Expense";

const ENDPOINT = "api/Expense";

// Budget status, the insight sentences and the cashflow projection are all
// computed from expenses, so every write here invalidates them.
const DEPENDANTS = [queryKeys.budgetStatusRoot, queryKeys.insights, queryKeys.cashflowProjection];

export const useExpensesQuery = () => useResourceQuery<Expense>(queryKeys.expenses, ENDPOINT);
export const useCreateExpense = () => useCreateResource<Expense>(queryKeys.expenses, ENDPOINT, DEPENDANTS);
export const useUpdateExpense = () => useUpdateResource<Expense>(queryKeys.expenses, ENDPOINT, DEPENDANTS);
export const useDeleteExpense = () => useDeleteResource<Expense>(queryKeys.expenses, ENDPOINT, DEPENDANTS);
