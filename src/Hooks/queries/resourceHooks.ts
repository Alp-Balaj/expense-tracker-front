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

export function useCreateResource<T extends EntityWithId>(queryKey: QueryKey, endpoint: string) {
  const { postData } = useAuthorizationApi();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: T) => postData<T, T>(endpoint, data),
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
}

export function useUpdateResource<T extends EntityWithId>(queryKey: QueryKey, endpoint: string) {
  const { putData } = useAuthorizationApi();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: T) => putData<T, T>(endpoint, data),
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
}

export function useDeleteResource<T extends EntityWithId>(queryKey: QueryKey, endpoint: string) {
  const { deleteData } = useAuthorizationApi();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: T) => deleteData<void>(endpoint, data),
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
}
