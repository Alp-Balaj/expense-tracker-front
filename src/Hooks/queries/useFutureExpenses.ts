import { useResourceQuery, useCreateResource, useUpdateResource, useDeleteResource } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import type { FutureExpense } from "@/Models/FutureExpense";

const ENDPOINT = "api/FutureExpense";

export const useFutureExpensesQuery = () => useResourceQuery<FutureExpense>(queryKeys.futureExpenses, ENDPOINT);
export const useCreateFutureExpense = () => useCreateResource<FutureExpense>(queryKeys.futureExpenses, ENDPOINT);
export const useUpdateFutureExpense = () => useUpdateResource<FutureExpense>(queryKeys.futureExpenses, ENDPOINT);
export const useDeleteFutureExpense = () => useDeleteResource<FutureExpense>(queryKeys.futureExpenses, ENDPOINT);
