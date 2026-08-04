import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import { useResourceQuery } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import type {
  CreatePot,
  CreatePotExpense,
  CreatePotTopUp,
  CreatePotWithdrawal,
  Pot,
  PotActivity,
  PotInvite,
  PotInvitePreview,
  PotLedger,
  PotMember,
  UpdatePot,
} from "@/Models/Pot";

const ENDPOINT = "api/Pot";

/**
 * Cycle U W1.
 *
 * Two things here differ from every other resource in the app, and both come
 * from the same fact: a pot has other people in it.
 *
 * **Invalidation is pot-wide.** Almost any pot write is visible on more than one
 * of a pot's screens — joining changes the member list *and* the activity log
 * *and* the list's member count. So the mutations invalidate `["pots", id]`,
 * which is the prefix of all three, rather than naming keys one at a time and
 * eventually forgetting one.
 *
 * **Staleness between members is left as it is.** Two people looking at one pot
 * disagree until one of them refetches; there is no socket and no polling loop,
 * and the execution plan names that as deliberately unanswered for the cycle.
 * What this wave picks is the narrow version: refetch a pot's screens when the
 * window regains focus, because the realistic case is a member coming back to
 * the tab after being told in a chat that something happened. Anything more is
 * a Cycle-3 conversation.
 */
const REFETCH_ON_FOCUS = { refetchOnWindowFocus: true } as const;

export const usePotsQuery = () => useResourceQuery<Pot>(queryKeys.pots, ENDPOINT);

export function usePotQuery(potId: string | undefined) {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData } = useAuthorizationApi();

  return useQuery({
    queryKey: queryKeys.pot(potId ?? ""),
    queryFn: () => getAllData<Pot>(`${ENDPOINT}/${potId}`),
    enabled: isAuthReady && !!accessToken && !!potId,
    ...REFETCH_ON_FOCUS,
  });
}

export function usePotMembersQuery(potId: string | undefined) {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData } = useAuthorizationApi();

  return useQuery({
    queryKey: queryKeys.potMembers(potId ?? ""),
    queryFn: () => getAllData<PotMember[]>(`${ENDPOINT}/${potId}/members`),
    enabled: isAuthReady && !!accessToken && !!potId,
    ...REFETCH_ON_FOCUS,
  });
}

export function usePotInvitesQuery(potId: string | undefined) {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData } = useAuthorizationApi();

  return useQuery({
    queryKey: queryKeys.potInvites(potId ?? ""),
    queryFn: () => getAllData<PotInvite[]>(`${ENDPOINT}/${potId}/invites`),
    enabled: isAuthReady && !!accessToken && !!potId,
    ...REFETCH_ON_FOCUS,
  });
}

export function usePotActivityQuery(potId: string | undefined) {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData } = useAuthorizationApi();

  return useQuery({
    queryKey: queryKeys.potActivity(potId ?? ""),
    queryFn: () => getAllData<PotActivity[]>(`${ENDPOINT}/${potId}/activity`),
    enabled: isAuthReady && !!accessToken && !!potId,
    ...REFETCH_ON_FOCUS,
  });
}

/** What a link says about the pot behind it, before you accept it. */
export function usePotInvitePreviewQuery(code: string | undefined) {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData } = useAuthorizationApi();

  return useQuery({
    queryKey: ["potInvitePreview", code ?? ""] as const,
    queryFn: () => getAllData<PotInvitePreview>(`${ENDPOINT}/invites/${code}`),
    enabled: isAuthReady && !!accessToken && !!code,
    retry: false,
  });
}

/** Everything about one pot, in one call. See the note on invalidation above. */
function usePotInvalidator() {
  const client = useQueryClient();

  return (potId?: string) => {
    client.invalidateQueries({ queryKey: queryKeys.pots });
    if (potId) client.invalidateQueries({ queryKey: queryKeys.pot(potId) });
  };
}

export function useCreatePot() {
  const { postData } = useAuthorizationApi();
  const invalidate = usePotInvalidator();

  return useMutation({
    mutationFn: (pot: CreatePot) => postData<Pot, CreatePot>(ENDPOINT, pot),
    onSuccess: (pot) => invalidate(pot.id),
  });
}

export function useUpdatePot() {
  const { putDataNoId } = useAuthorizationApi();
  const invalidate = usePotInvalidator();

  return useMutation({
    mutationFn: ({ id, pot }: { id: string; pot: UpdatePot }) =>
      putDataNoId<Pot, UpdatePot>(`${ENDPOINT}/${id}`, pot),
    onSuccess: (pot) => invalidate(pot.id),
  });
}

export function useCreatePotInvite() {
  const { postData } = useAuthorizationApi();
  const invalidate = usePotInvalidator();

  return useMutation({
    mutationFn: (potId: string) =>
      postData<PotInvite, Record<string, never>>(`${ENDPOINT}/${potId}/invites`, {}),
    onSuccess: (_invite, potId) => invalidate(potId),
  });
}

export function useRevokePotInvite() {
  const { postData } = useAuthorizationApi();
  const invalidate = usePotInvalidator();

  return useMutation({
    mutationFn: ({ potId, inviteId }: { potId: string; inviteId: string }) =>
      postData<PotInvite, Record<string, never>>(
        `${ENDPOINT}/${potId}/invites/${inviteId}/revoke`,
        {},
      ),
    onSuccess: (_invite, { potId }) => invalidate(potId),
  });
}

export function useJoinPot() {
  const { postData } = useAuthorizationApi();
  const invalidate = usePotInvalidator();

  return useMutation({
    mutationFn: (code: string) => postData<Pot, { code: string }>(`${ENDPOINT}/join`, { code }),
    onSuccess: (pot) => invalidate(pot.id),
  });
}

export function useLeavePot() {
  const { postData } = useAuthorizationApi();
  const invalidate = usePotInvalidator();

  return useMutation({
    mutationFn: (potId: string) =>
      postData<void, Record<string, never>>(`${ENDPOINT}/${potId}/leave`, {}),
    onSuccess: (_result, potId) => invalidate(potId),
  });
}

// ── W2, the ledger ──────────────────────────────────────────────────────────

/**
 * Balance, positions and the money feed, in one read — see `PotLedger`.
 *
 * Every write below answers with the whole fresh ledger, so each one seeds this
 * cache directly rather than invalidating and waiting for a refetch. On a phone
 * that is the difference between the balance updating as the sheet closes and
 * it updating a moment later, which on a screen whose promise is "these numbers
 * agree" reads as a bug.
 *
 * The pot list and the activity log are still invalidated, because they moved
 * too and this response does not carry them.
 */
export function usePotLedgerQuery(potId: string | undefined) {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData } = useAuthorizationApi();

  return useQuery({
    queryKey: queryKeys.potLedger(potId ?? ""),
    queryFn: () => getAllData<PotLedger>(`${ENDPOINT}/${potId}/ledger`),
    enabled: isAuthReady && !!accessToken && !!potId,
    ...REFETCH_ON_FOCUS,
  });
}

/**
 * What every ledger write does with its answer: put the fresh ledger straight
 * into the cache, then let the rest of the pot's screens refetch.
 */
function useLedgerWriter() {
  const client = useQueryClient();

  return (potId: string, ledger: PotLedger) => {
    client.setQueryData(queryKeys.potLedger(potId), ledger);
    client.invalidateQueries({ queryKey: queryKeys.pots });
    client.invalidateQueries({ queryKey: queryKeys.potActivity(potId) });
    // The member's own accounts moved on a top-up, a withdrawal and a fronted
    // expense — and their budgets and category totals moved on a share. All of
    // those live outside this pot's keys.
    client.invalidateQueries({ queryKey: queryKeys.accounts });
    client.invalidateQueries({ queryKey: queryKeys.categories });
    client.invalidateQueries({ queryKey: queryKeys.budgetStatusRoot });
  };
}

export function usePotTopUp() {
  const { postData } = useAuthorizationApi();
  const write = useLedgerWriter();

  return useMutation({
    mutationFn: ({ potId, topUp }: { potId: string; topUp: CreatePotTopUp }) =>
      postData<PotLedger, CreatePotTopUp>(`${ENDPOINT}/${potId}/topups`, topUp),
    onSuccess: (ledger, { potId }) => write(potId, ledger),
  });
}

export function useLogPotExpense() {
  const { postData } = useAuthorizationApi();
  const write = useLedgerWriter();

  return useMutation({
    mutationFn: ({ potId, expense }: { potId: string; expense: CreatePotExpense }) =>
      postData<PotLedger, CreatePotExpense>(`${ENDPOINT}/${potId}/expenses`, expense),
    onSuccess: (ledger, { potId }) => write(potId, ledger),
  });
}

export function useDeletePotExpense() {
  const { deleteDataNoId } = useAuthorizationApi();
  const write = useLedgerWriter();

  return useMutation({
    mutationFn: ({ potId, expenseId }: { potId: string; expenseId: string }) =>
      deleteDataNoId<PotLedger>(`${ENDPOINT}/${potId}/expenses/${expenseId}`),
    onSuccess: (ledger, { potId }) => write(potId, ledger),
  });
}

export function usePotWithdrawal() {
  const { postData } = useAuthorizationApi();
  const write = useLedgerWriter();

  return useMutation({
    mutationFn: ({ potId, withdrawal }: { potId: string; withdrawal: CreatePotWithdrawal }) =>
      postData<PotLedger, CreatePotWithdrawal>(`${ENDPOINT}/${potId}/withdrawals`, withdrawal),
    onSuccess: (ledger, { potId }) => write(potId, ledger),
  });
}
