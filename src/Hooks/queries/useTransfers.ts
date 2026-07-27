import { useResourceQuery, useCreateResource, useUpdateResource, useDeleteResource } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import type { Transfer } from "@/Models/Transfer";

const ENDPOINT = "api/Transfer";

// A transfer rewrites two account balances, and — when it names a goal — that
// goal's saved amount, so every write refreshes both of those keys too.
// Budget status is deliberately absent: transfers are not spending.
const DEPENDANTS = [queryKeys.accounts, queryKeys.savingGoals];

export const useTransfersQuery = () => useResourceQuery<Transfer>(queryKeys.transfers, ENDPOINT);
export const useCreateTransfer = () => useCreateResource<Transfer>(queryKeys.transfers, ENDPOINT, DEPENDANTS);
export const useUpdateTransfer = () => useUpdateResource<Transfer>(queryKeys.transfers, ENDPOINT, DEPENDANTS);
export const useDeleteTransfer = () => useDeleteResource<Transfer>(queryKeys.transfers, ENDPOINT, DEPENDANTS);
