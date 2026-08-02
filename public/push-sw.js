/* eslint-disable no-undef */
/**
 * Push handlers for the app-shell service worker.
 *
 * Imported into the Workbox-generated `sw.js` via `workbox.importScripts` rather
 * than replacing it. Stream A shipped a precache-only service worker and verified
 * that contract — no runtime caching, no background sync — and Stream O is going
 * to extend the same file into background sync. Keeping the push half in its own
 * script means neither stream has to own the other's generated output, and A's
 * precache manifest stays byte-identical.
 *
 * Plain JS, not TypeScript: it is never processed by Vite. It is copied verbatim
 * from `public/` and runs in the service worker global scope.
 */

/**
 * Shown when a push arrives with no readable payload. Push services are allowed
 * to deliver a bare "wake up" with no body at all, and Chrome forces a generic
 * "This site has been updated in the background" notification if the handler
 * shows nothing — so there is always something to show.
 */
const FALLBACK = {
  title: "ExpenseTracker",
  body: "Something needs your attention.",
  url: "/",
  tag: "expensetracker",
};

function readPayload(event) {
  if (!event.data) return FALLBACK;
  try {
    const payload = event.data.json();
    return {
      title: payload.title || FALLBACK.title,
      body: payload.body || FALLBACK.body,
      url: payload.url || FALLBACK.url,
      tag: payload.tag || FALLBACK.tag,
    };
  } catch {
    // Not JSON — show it as text rather than dropping the notification.
    return { ...FALLBACK, body: event.data.text() || FALLBACK.body };
  }
}

self.addEventListener("push", (event) => {
  const payload = readPayload(event);

  // waitUntil is not optional: without it the worker may be killed before the
  // notification is shown, and the browser then shows its own generic one.
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      // Same tag replaces rather than stacks: a second budget warning should
      // update the one already in the tray.
      tag: payload.tag,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      data: { url: payload.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Focus an open tab and route it, rather than opening a second copy of the
      // app — the notification is about a screen, not a new session.
      for (const client of clientList) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(target);
            } catch {
              // Cross-origin or a navigation the client refused; the focus alone
              // is still the right outcome.
            }
          }
          return;
        }
      }

      if (self.clients.openWindow) await self.clients.openWindow(target);
    })()
  );
});
