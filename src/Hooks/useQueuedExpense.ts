import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { api } from "@/Services/api";
import { queryKeys } from "@/Hooks/queries/queryKeys";
import { enqueue } from "@/lib/outbox";
import type { Expense } from "@/Models/Expense";

const ENDPOINT = "api/Expense";

export type QueuedWriteOutcome = "sent" | "queued";

/**
 * Creating an expense that survives having no network.
 *
 * <h3>What "offline" actually means here</h3>
 * Not `navigator.onLine`. That flag is famously optimistic — it says true on a
 * hotel wifi that has associated but not authenticated, and on a train that has
 * a bar of signal and no route. It is used as a cheap short-circuit when it says
 * *false* (which is reliable), but the real test is a request that got no
 * response at all. A 400 is not offline: the server was reached and said no, and
 * that has to reach the user rather than being queued to fail again later.
 *
 * <h3>The key comes first</h3>
 * The idempotency key is minted before the first attempt and reused by every
 * retry, which is what lets the server tell a replay from a second coffee. It is
 * also the queue entry's id and the optimistic row's id, so all three refer to
 * the same intent.
 */
export function useQueuedCreateExpense() {
  const queryClient = useQueryClient();

  return useCallback(
    async (payload: Expense): Promise<QueuedWriteOutcome> => {
      const key = crypto.randomUUID();
      const body = { ...payload, id: null };

      const queue = async (): Promise<QueuedWriteOutcome> => {
        await enqueue(key, ENDPOINT, body);

        // Optimistic application: the row appears in the list and in every total
        // derived from the cache immediately, carrying the queue id so the drain
        // can replace it, and flagged pending so it never passes for saved.
        queryClient.setQueryData<Expense[]>(queryKeys.expenses, (current) => [
          { ...body, id: key, pending: true },
          ...(current ?? []),
        ]);

        // Ask the worker for a Background Sync registration, so a browser that
        // has one wakes the app the moment connectivity returns instead of
        // waiting for it to be opened. Best-effort by design: Safari and Firefox
        // have no sync API, and the page's own online listener is what actually
        // drains the queue everywhere.
        void navigator.serviceWorker?.ready
          .then((registration) => registration.active?.postMessage({ type: "outbox-register" }))
          .catch(() => {});

        return "queued";
      };

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return queue();
      }

      try {
        await api.post(ENDPOINT, body, { headers: { "Idempotency-Key": key } });

        void queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
        void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
        void queryClient.invalidateQueries({ queryKey: queryKeys.budgetStatusRoot });
        void queryClient.invalidateQueries({ queryKey: queryKeys.insights });
        void queryClient.invalidateQueries({ queryKey: queryKeys.cashflowProjection });

        return "sent";
      } catch (error) {
        // No response means the request never landed — or landed and the reply
        // was lost, which is the case the idempotency key exists for. Either way
        // the honest move is to queue it and retry.
        if (isAxiosError(error) && error.response === undefined) {
          return queue();
        }

        // The server answered. Whatever it said, the user needs to see it.
        throw error;
      }
    },
    [queryClient]
  );
}
