import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import { queryKeys } from "./queryKeys";
import type { CashflowProjection } from "@/Models/Cashflow";

const ENDPOINT = "api/Cashflow/projection";

/**
 * The dashboard's cashflow projection. A single computed object rather than a
 * list, so this bypasses `useResourceQuery` (which is typed for arrays) and
 * has no mutation half — the writes that move it (expenses, incomes, accounts,
 * planned transactions) list this key as a dependant.
 */
export const useCashflowProjectionQuery = () => {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData } = useAuthorizationApi();

  return useQuery({
    queryKey: queryKeys.cashflowProjection,
    queryFn: () => getAllData<CashflowProjection>(ENDPOINT),
    enabled: isAuthReady && !!accessToken,
  });
};
