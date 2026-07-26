import { useResourceQuery, useCreateResource, useUpdateResource, useDeleteResource } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import type { Currency } from "@/Models/Currency";

const ENDPOINT = "api/Currency";
const FIVE_MINUTES = 5 * 60_000;

export const useCurrenciesQuery = () => useResourceQuery<Currency>(queryKeys.currencies, ENDPOINT, FIVE_MINUTES);
export const useCreateCurrency = () => useCreateResource<Currency>(queryKeys.currencies, ENDPOINT);
export const useUpdateCurrency = () => useUpdateResource<Currency>(queryKeys.currencies, ENDPOINT);
export const useDeleteCurrency = () => useDeleteResource<Currency>(queryKeys.currencies, ENDPOINT);
