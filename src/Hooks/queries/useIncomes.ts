import { useResourceQuery, useCreateResource, useUpdateResource, useDeleteResource } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import type { Income } from "@/Models/Income";

const ENDPOINT = "api/Income";

// An income moves an account balance, and the cashflow projection starts from
// those balances — so income writes refresh it.
const DEPENDANTS = [queryKeys.cashflowProjection];

export const useIncomesQuery = () => useResourceQuery<Income>(queryKeys.incomes, ENDPOINT);
export const useCreateIncome = () => useCreateResource<Income>(queryKeys.incomes, ENDPOINT, DEPENDANTS);
export const useUpdateIncome = () => useUpdateResource<Income>(queryKeys.incomes, ENDPOINT, DEPENDANTS);
export const useDeleteIncome = () => useDeleteResource<Income>(queryKeys.incomes, ENDPOINT, DEPENDANTS);
