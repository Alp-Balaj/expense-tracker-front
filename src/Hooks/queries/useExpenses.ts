import { useResourceQuery, useCreateResource, useUpdateResource, useDeleteResource } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import type { Expense } from "@/Models/Expense";

const ENDPOINT = "api/Expense";

export const useExpensesQuery = () => useResourceQuery<Expense>(queryKeys.expenses, ENDPOINT);
export const useCreateExpense = () => useCreateResource<Expense>(queryKeys.expenses, ENDPOINT);
export const useUpdateExpense = () => useUpdateResource<Expense>(queryKeys.expenses, ENDPOINT);
export const useDeleteExpense = () => useDeleteResource<Expense>(queryKeys.expenses, ENDPOINT);
