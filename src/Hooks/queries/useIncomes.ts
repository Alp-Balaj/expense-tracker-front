import { useResourceQuery, useCreateResource, useUpdateResource, useDeleteResource } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import type { Income } from "@/Models/Income";

const ENDPOINT = "api/Income";

export const useIncomesQuery = () => useResourceQuery<Income>(queryKeys.incomes, ENDPOINT);
export const useCreateIncome = () => useCreateResource<Income>(queryKeys.incomes, ENDPOINT);
export const useUpdateIncome = () => useUpdateResource<Income>(queryKeys.incomes, ENDPOINT);
export const useDeleteIncome = () => useDeleteResource<Income>(queryKeys.incomes, ENDPOINT);
