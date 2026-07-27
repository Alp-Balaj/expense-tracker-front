import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";

type EntityWithId = { id: string | null };

// Shared read side of the per-resource query hooks: one cache entry per
// queryKey means every consumer (page, list, form, summary card) that asks
// for the same resource shares a single in-flight request instead of each
// firing its own.
export function useResourceQuery<T>(queryKey: QueryKey, endpoint: string, staleTime?: number) {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData } = useAuthorizationApi();

  return useQuery({
    queryKey,
    queryFn: () => getAllData<T[]>(endpoint),
    enabled: isAuthReady && !!accessToken,
    staleTime,
  });
}

// Some resources are inputs to a derived query owned by another key — writing
// an expense, for instance, changes every budget's status. `alsoInvalidate`
// lists those dependants so a mutation refreshes them along with its own key.
function useInvalidator(queryKey: QueryKey, alsoInvalidate: QueryKey[] = []) {
  const client = useQueryClient();

  return () => {
    client.invalidateQueries({ queryKey });
    alsoInvalidate.forEach((key) => client.invalidateQueries({ queryKey: key }));
  };
}

export function useCreateResource<T extends EntityWithId>(
  queryKey: QueryKey,
  endpoint: string,
  alsoInvalidate?: QueryKey[]
) {
  const { postData } = useAuthorizationApi();
  const invalidate = useInvalidator(queryKey, alsoInvalidate);

  return useMutation({
    mutationFn: (data: T) => postData<T, T>(endpoint, data),
    onSuccess: invalidate,
  });
}

export function useUpdateResource<T extends EntityWithId>(
  queryKey: QueryKey,
  endpoint: string,
  alsoInvalidate?: QueryKey[]
) {
  const { putData } = useAuthorizationApi();
  const invalidate = useInvalidator(queryKey, alsoInvalidate);

  return useMutation({
    mutationFn: (data: T) => putData<T, T>(endpoint, data),
    onSuccess: invalidate,
  });
}

export function useDeleteResource<T extends EntityWithId>(
  queryKey: QueryKey,
  endpoint: string,
  alsoInvalidate?: QueryKey[]
) {
  const { deleteData } = useAuthorizationApi();
  const invalidate = useInvalidator(queryKey, alsoInvalidate);

  return useMutation({
    mutationFn: (data: T) => deleteData<void>(endpoint, data),
    onSuccess: invalidate,
  });
}
