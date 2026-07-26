import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useResourceQuery, useCreateResource, useUpdateResource, useDeleteResource } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import { SAVING_GOAL_API } from "@/Services/api";
import type { AddSavingsGoal, SavingContributions, SavingGoals } from "@/Models/SavingGoals";

export const useSavingGoalsQuery = () => useResourceQuery<SavingGoals>(queryKeys.savingGoals, SAVING_GOAL_API);
export const useCreateSavingGoal = () => useCreateResource<AddSavingsGoal>(queryKeys.savingGoals, SAVING_GOAL_API);
export const useUpdateSavingGoal = () => useUpdateResource<AddSavingsGoal>(queryKeys.savingGoals, SAVING_GOAL_API);
export const useDeleteSavingGoal = () => useDeleteResource<SavingGoals>(queryKeys.savingGoals, SAVING_GOAL_API);

export function useAddSavingContribution() {
  const { postData } = useAuthorizationApi();
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, contribution }: { goalId: string; contribution: SavingContributions }) =>
      postData(`api/SavingContribution/${goalId}`, contribution),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.savingGoals }),
  });
}
