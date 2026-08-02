/**
 * The browser side of Web Push, minus React: everything here is a pure function
 * of the Push API's own objects, so the awkward parts (key encoding, the four
 * distinct ways this can be unavailable) are testable without a service worker.
 */

/** What a device can be, from the settings screen's point of view. */
export type PushState =
  /** The browser has no Push API, or the app is not installed on iOS. */
  | "unsupported"
  /** This deployment has no VAPID keys, so there is nothing to subscribe to. */
  | "unavailable"
  /** Supported and available, permission not yet asked for. */
  | "prompt"
  /** The user said no. Only they can undo this, in browser settings. */
  | "denied"
  /** Permission granted and a subscription is registered. */
  | "subscribed";

/**
 * The three fields the server needs, pulled out of a browser `PushSubscription`.
 * `toJSON()` is the standard shape and every engine implements it, but its keys
 * are typed as optional, so this narrows them once instead of at every call site.
 */
export interface SerializedSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * Turns the base64url application server key into the `Uint8Array` that
 * `pushManager.subscribe` demands.
 *
 * Every browser refuses a plain string here, and refuses it with a DOMException
 * that says nothing useful — this conversion is the single most commonly
 * mis-implemented line in Web Push.
 */
// Uint8Array<ArrayBuffer>, not the default Uint8Array<ArrayBufferLike>:
// `applicationServerKey` is typed as BufferSource, which excludes a view over a
// SharedArrayBuffer, and TypeScript 5.7's typed array generics enforce it.
export function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");

  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Whether this browser can do Web Push at all.
 *
 * The `PushManager` check is the one that matters on iOS: Safari exposes
 * `Notification` and a service worker in a normal tab but only exposes
 * `PushManager` once the app has been added to the home screen — so this is
 * also, in effect, the "is it installed" test on iPhone.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Reads the four states above out of the browser plus the server's answer. */
export function resolvePushState(
  available: boolean,
  hasSubscription: boolean,
  permission: NotificationPermission | null
): PushState {
  if (!isPushSupported()) return "unsupported";
  if (!available) return "unavailable";
  if (permission === "denied") return "denied";
  if (permission === "granted" && hasSubscription) return "subscribed";
  return "prompt";
}

/**
 * Narrows a browser subscription to what the API accepts, or null when the
 * browser handed back a subscription without keys — which happens on older
 * engines and would otherwise be posted as `undefined` and rejected server-side
 * with a validation error nobody can act on.
 */
export function serializeSubscription(
  subscription: PushSubscription
): SerializedSubscription | null {
  const json = subscription.toJSON();
  const endpoint = json.endpoint ?? subscription.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) return null;
  return { endpoint, keys: { p256dh, auth } };
}

/**
 * A short human label for the device list — "Firefox on Linux" beats a 200
 * character UA string in a settings row. Best-effort by design: this is a label,
 * never a decision, so a browser it does not recognise degrades to its own words
 * rather than to nothing.
 */
export function describeBrowser(userAgent: string): string {
  const browser =
    /Edg\//.test(userAgent) ? "Edge"
    : /OPR\//.test(userAgent) ? "Opera"
    : /Firefox\//.test(userAgent) ? "Firefox"
    : /Chrome\//.test(userAgent) ? "Chrome"
    : /Safari\//.test(userAgent) ? "Safari"
    : null;

  const platform =
    /Android/.test(userAgent) ? "Android"
    : /iPhone|iPad|iPod/.test(userAgent) ? "iOS"
    : /Mac OS X/.test(userAgent) ? "macOS"
    : /Windows/.test(userAgent) ? "Windows"
    : /Linux/.test(userAgent) ? "Linux"
    : null;

  if (browser && platform) return `${browser} on ${platform}`;
  if (browser) return browser;
  return userAgent.slice(0, 60) || "This device";
}
