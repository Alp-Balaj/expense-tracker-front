import { useResourceQuery, useCreateResource, useUpdateResource, useDeleteResource } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import type { Expense } from "@/Models/Expense";

const ENDPOINT = "api/Expense";

// Budget status is computed from expenses, so every write here invalidates it.
const DEPENDANTS = [queryKeys.budgetStatusRoot];

export const useExpensesQuery = () => useResourceQuery<Expense>(queryKeys.expenses, ENDPOINT);
export const useCreateExpense = () => useCreateResource<Expense>(queryKeys.expenses, ENDPOINT, DEPENDANTS);
export const useUpdateExpense = () => useUpdateResource<Expense>(queryKeys.expenses, ENDPOINT, DEPENDANTS);
export const useDeleteExpense = () => useDeleteResource<Expense>(queryKeys.expenses, ENDPOINT, DEPENDANTS);
