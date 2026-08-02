import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import { queryKeys } from "./queryKeys";
import type { Insights } from "@/Models/Insights";

const ENDPOINT = "api/Insights";

/**
 * The dashboard's spending insights. A single computed object rather than a
 * list, so this bypasses `useResourceQuery` (which is typed for arrays) and
 * has no mutation half — writes happen on expenses, which list this key as a
 * dependant.
 */
export const useInsightsQuery = () => {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData } = useAuthorizationApi();

  return useQuery({
    queryKey: queryKeys.insights,
    queryFn: () => getAllData<Insights>(ENDPOINT),
    enabled: isAuthReady && !!accessToken,
  });
};
