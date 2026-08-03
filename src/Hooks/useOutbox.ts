import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { api } from "@/Services/api";
import { queryKeys } from "@/Hooks/queries/queryKeys";
import {
  pending as readPending,
  recordFailure,
  remove,
  replayable,
  type OutboxEntry,
} from "@/lib/outbox";

/**
 * One drain at a time, across every consumer of this hook.
 *
 * Module scope rather than a ref, which the browser pass proved was necessary:
 * the indicator is rendered in both the desktop and the mobile top bar, so two
 * hook instances mount and two drains raced on reconnect. The server's in-flight
 * guard caught it — the account was still right — but at the cost of a 409 the
 * user has no use for and a burnt retry on the entry. A ref is per-instance and
 * cannot see the other drain; this can.
 */
let draining = false;

/**
 * Drains the outbox, and tells the UI what is still in it.
 *
 * <h3>Why the page replays, and not the service worker</h3>
 * The brief for this stream said "service-worker replay on reconnect", and that
 * is the wrong shape here — worth writing down rather than quietly doing
 * something else. Every queued write is an authenticated POST, and the bearer
 * token lives in the page, not in the worker. Replaying from the worker means
 * putting a JWT in IndexedDB for it to read, which is both a real widening of
 * what "clear site data" is protecting and pointless: the access token expires
 * in sixty minutes, so a Background Sync event firing hours later — the exact
 * case background sync exists for — would authenticate nothing.
 *
 * So the page drains the queue: on load, whenever the browser reports the
 * network is back, and after any successful write. The worker still helps —
 * `outbox-sw.js` forwards its `sync` event to any open client — but it is a
 * nudge, not the mechanism. The user-visible behaviour is the same in every
 * case that can actually work.
 */

export function useOutbox() {
  const queryClient = useQueryClient();

  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  const [isFlushing, setIsFlushing] = useState(false);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const queued = await readPending();
    if (alive.current) setEntries(queued);
  }, []);

  const flush = useCallback(async () => {
    if (draining) return;

    // Offline is the moment the indicator matters most, so read the queue before
    // declining to send it. The browser pass caught this the honest way: an
    // expense logged in a basement queued correctly and the app showed nothing.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      await refresh();
      return;
    }

    draining = true;
    setIsFlushing(true);

    try {
      const queued = replayable(await readPending());
      let sent = 0;

      for (const entry of queued) {
        try {
          await api.post(entry.endpoint, entry.payload, {
            // The whole contract in one header. The key was minted when the
            // expense was typed, so the server can tell this retry from a
            // second, genuinely different coffee.
            headers: { "Idempotency-Key": entry.id },
          });

          await remove(entry.id);
          sent++;
        } catch (error) {
          const status = isAxiosError(error) ? error.response?.status : undefined;

          if (status === undefined) {
            // No response at all — still offline, or the request died in
            // transit. Stop the drain rather than burning every entry's retry
            // budget against a network that is not there.
            await recordFailure(entry.id, "Could not reach the server.");
            break;
          }

          if (status === 409) {
            // The first attempt is still being processed server-side. It will
            // finish; come back on the next drain.
            await recordFailure(entry.id, "Still being processed.");
            break;
          }

          const permanent = status >= 400 && status < 500;
          await recordFailure(
            entry.id,
            isAxiosError(error) ? (error.response?.statusText ?? error.message) : "Failed to send.",
            permanent
          );
        }
      }

      if (sent > 0) {
        // A queued expense that lands changes balances and everything derived
        // from them, exactly as an online one does.
        for (const key of [
          queryKeys.expenses,
          queryKeys.incomes,
          queryKeys.accounts,
          queryKeys.budgetStatusRoot,
          queryKeys.insights,
          queryKeys.cashflowProjection,
        ]) {
          void queryClient.invalidateQueries({ queryKey: key });
        }
      }
    } finally {
      draining = false;
      if (alive.current) setIsFlushing(false);
      await refresh();
    }
  }, [queryClient, refresh]);

  useEffect(() => {
    void flush();

    const onOnline = () => void flush();
    window.addEventListener("online", onOnline);

    // The worker's `sync` event, forwarded to whichever client is open. A nudge:
    // if no client is open there is no token to send with, and the next app
    // open drains the queue anyway.
    const onWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "outbox-sync") void flush();
    };
    navigator.serviceWorker?.addEventListener("message", onWorkerMessage);

    return () => {
      window.removeEventListener("online", onOnline);
      navigator.serviceWorker?.removeEventListener("message", onWorkerMessage);
    };
  }, [flush]);

  return {
    entries,
    pendingCount: entries.filter((e) => !e.needsAttention).length,
    stuck: entries.filter((e) => e.needsAttention),
    isFlushing,
    flush,
    refresh,
  };
}
