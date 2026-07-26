import { useResourceQuery, useCreateResource, useUpdateResource, useDeleteResource } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import type { Account, AddAccount } from "@/Models/Account";

const ENDPOINT = "api/Account";
const FIVE_MINUTES = 5 * 60_000;

export const useAccountsQuery = () => useResourceQuery<Account>(queryKeys.accounts, ENDPOINT, FIVE_MINUTES);
export const useCreateAccount = () => useCreateResource<AddAccount>(queryKeys.accounts, ENDPOINT);
export const useUpdateAccount = () => useUpdateResource<AddAccount>(queryKeys.accounts, ENDPOINT);
export const useDeleteAccount = () => useDeleteResource<Account>(queryKeys.accounts, ENDPOINT);
