import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useResourceQuery } from "./resourceHooks";
import { queryKeys } from "./queryKeys";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import type { Reimbursement, SettleReimbursement } from "@/Models/Reimbursement";

const ENDPOINT = "api/Reimbursement";

/**
 * The open receivables — what others still owe on split expenses. The endpoint
 * returns only the open ones by default, which is exactly what the dashboard
 * panel and the settle dialog want, so nothing here asks for the settled ones.
 */
export const useReimbursementsQuery = () =>
  useResourceQuery<Reimbursement>(queryKeys.reimbursements, ENDPOINT);

/**
 * Recording a settlement credits a real account, so it moves more than this
 * list: the balance changes, the receivable shrinks, and every figure derived
 * from expenses net of what is owed moves with it. Listing them here is what
 * stops the rest of the app showing yesterday's numbers the moment a friend
 * pays you back.
 *
 * A settlement is never income — no income key is invalidated because no income
 * row is ever created.
 */
export function useSettleReimbursement() {
  const { postData } = useAuthorizationApi();
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, settlement }: { id: string; settlement: SettleReimbursement }) =>
      postData<Reimbursement, SettleReimbursement>(
        `${ENDPOINT}/${id}/settlements`,
        settlement,
      ),
    onSuccess: () => {
      [
        queryKeys.reimbursements,
        queryKeys.accounts,
        queryKeys.expenses,
        queryKeys.budgetStatusRoot,
        queryKeys.insights,
        queryKeys.cashflowProjection,
      ].forEach((queryKey) => client.invalidateQueries({ queryKey }));
    },
  });
}
