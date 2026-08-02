import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  useResourceQuery,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
} from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import { PLANNED_API, PLANNED_OCCURRENCES_API } from "@/Services/api";
import type {
  CommitOccurrence,
  PlannedOccurrence,
  PlannedTransaction,
} from "@/Models/PlannedTransaction";

/**
 * Reading either endpoint is what advances the schedule — the server
 * materialises anything newly due as a side effect of the GET, which is why
 * there is no background job anywhere in this feature.
 *
 * A consequence worth knowing: editing a template can change what is due, so
 * template writes invalidate the queue as well as the list.
 */
const QUEUE = [queryKeys.plannedOccurrences, queryKeys.cashflowProjection];

export const usePlannedTransactionsQuery = () =>
  useResourceQuery<PlannedTransaction>(queryKeys.plannedTransactions, PLANNED_API);

export const usePlannedOccurrencesQuery = () =>
  useResourceQuery<PlannedOccurrence>(queryKeys.plannedOccurrences, PLANNED_OCCURRENCES_API);

export const useCreatePlannedTransaction = () =>
  useCreateResource<PlannedTransaction>(queryKeys.plannedTransactions, PLANNED_API, QUEUE);

export const useUpdatePlannedTransaction = () =>
  useUpdateResource<PlannedTransaction>(queryKeys.plannedTransactions, PLANNED_API, QUEUE);

export const useDeletePlannedTransaction = () =>
  useDeleteResource<PlannedTransaction>(queryKeys.plannedTransactions, PLANNED_API, QUEUE);

/**
 * Confirming an occurrence posts real money, so it touches almost everything:
 * a balance moves, a transaction appears, and a budget's status changes with it.
 * Listing them here is what stops the rest of the app showing stale figures the
 * moment you confirm rent.
 */
function useOccurrenceInvalidator() {
  const client = useQueryClient();

  return () => {
    [
      queryKeys.plannedOccurrences,
      queryKeys.plannedTransactions,
      queryKeys.accounts,
      queryKeys.expenses,
      queryKeys.incomes,
      queryKeys.transfers,
      queryKeys.savingGoals,
      queryKeys.budgetStatusRoot,
      queryKeys.insights,
      queryKeys.cashflowProjection,
    ].forEach((queryKey) => client.invalidateQueries({ queryKey }));
  };
}

export function useCommitOccurrence() {
  const { postData } = useAuthorizationApi();
  const invalidate = useOccurrenceInvalidator();

  return useMutation({
    mutationFn: ({ id, commit }: { id: string; commit: CommitOccurrence }) =>
      postData<void, CommitOccurrence>(`${PLANNED_OCCURRENCES_API}/${id}/commit`, commit),
    onSuccess: invalidate,
  });
}

export function useSkipOccurrence() {
  const { postData } = useAuthorizationApi();
  const invalidate = useOccurrenceInvalidator();

  return useMutation({
    // Skipping posts nothing, but it still leaves the queue — and the nav badge
    // counts the queue, so the same invalidation applies.
    mutationFn: (id: string) =>
      postData<void, Record<string, never>>(`${PLANNED_OCCURRENCES_API}/${id}/skip`, {}),
    onSuccess: invalidate,
  });
}
