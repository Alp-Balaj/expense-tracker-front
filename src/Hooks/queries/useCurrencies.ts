import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useResourceQuery, useCreateResource, useUpdateResource, useDeleteResource } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import type { Currency } from "@/Models/Currency";

const ENDPOINT = "api/Currency";
const FIVE_MINUTES = 5 * 60_000;

export type RefreshRatesResult = {
  baseCurrency: string;
  ratesAsOf: string | null;
  updatedCount: number;
  /** Currencies the upstream doesn't publish; their hand-entered rates are untouched. */
  unsupportedCodes: string[];
  /** The fetch failed or the base currency isn't covered — every stored rate survives. */
  providerUnavailable: boolean;
  currencies: Currency[];
};

export const useCurrenciesQuery = () => useResourceQuery<Currency>(queryKeys.currencies, ENDPOINT, FIVE_MINUTES);
export const useCreateCurrency = () => useCreateResource<Currency>(queryKeys.currencies, ENDPOINT);
export const useUpdateCurrency = () => useUpdateResource<Currency>(queryKeys.currencies, ENDPOINT);
export const useDeleteCurrency = () => useDeleteResource<Currency>(queryKeys.currencies, ENDPOINT);

// Pulls today's rates on demand instead of waiting for the server's daily sweep.
// Resolves even when the upstream is down — check `providerUnavailable` rather than
// catching, since a failed fetch is a normal outcome that changes nothing.
export const useRefreshRates = () => {
  const { postData } = useAuthorizationApi();
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => postData<RefreshRatesResult, undefined>(`${ENDPOINT}/RefreshRates`, undefined),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.currencies });
      // New rates change every converted total on screen — budget status is
      // computed in the user's base currency server-side.
      client.invalidateQueries({ queryKey: queryKeys.budgetStatusRoot });
    },
  });
};
