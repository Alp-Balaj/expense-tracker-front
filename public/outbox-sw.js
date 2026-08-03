/* eslint-disable no-undef */
/**
 * Background Sync support for the offline outbox.
 *
 * Imported into the Workbox-generated worker alongside `push-sw.js`, the same
 * way and for the same reason: Stream A's precache contract stays byte-identical
 * and neither stream owns the other's generated output.
 *
 * <h3>What this deliberately does not do</h3>
 * It does not replay the queue. Every queued write is an authenticated POST and
 * the bearer token lives in the page, not here. Putting a JWT in IndexedDB for
 * this worker to read would widen what "clear site data" is protecting and would
 * buy nothing anyway — the access token expires in sixty minutes, so a sync
 * event firing hours later, which is precisely the case Background Sync exists
 * for, would authenticate nothing.
 *
 * So this is a doorbell. When the browser decides connectivity is back it wakes
 * the worker, and the worker tells any open client to drain its own queue. If no
 * client is open there is nothing useful to do, and the next time the app is
 * opened it drains on load regardless.
 */

const OUTBOX_TAG = "expensetracker-outbox";

async function nudgeClients() {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: "outbox-sync" });
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag !== OUTBOX_TAG) return;
  event.waitUntil(nudgeClients());
});

// Chromium-only and still behind a flag in places; harmless where absent.
self.addEventListener("periodicsync", (event) => {
  if (event.tag !== OUTBOX_TAG) return;
  event.waitUntil(nudgeClients());
});

// The page asks for a sync registration once it has something queued.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "outbox-register") return;

  event.waitUntil(
    (async () => {
      try {
        await self.registration.sync?.register(OUTBOX_TAG);
      } catch {
        // No Background Sync in this browser (Safari, Firefox). The page's own
        // online listener is the mechanism there, and it is the mechanism
        // everywhere — this only ever shortens the wait.
      }
    })()
  );
});
