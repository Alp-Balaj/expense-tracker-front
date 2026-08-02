import { describe, expect, it, afterEach } from "vitest";

import {
  describeBrowser,
  isPushSupported,
  resolvePushState,
  serializeSubscription,
  urlBase64ToUint8Array,
} from "@/lib/push";

/**
 * jsdom has no Push API, so `isPushSupported()` is false by default and
 * `resolvePushState` short-circuits to "unsupported". These stubs make the
 * browser look capable so the other branches are reachable.
 */
function pretendPushIsSupported() {
  const originals = {
    serviceWorker: (navigator as Navigator & { serviceWorker?: unknown }).serviceWorker,
    pushManager: (window as Window & { PushManager?: unknown }).PushManager,
    notification: (window as Window & { Notification?: unknown }).Notification,
  };

  Object.defineProperty(navigator, "serviceWorker", { value: {}, configurable: true });
  Object.defineProperty(window, "PushManager", { value: class {}, configurable: true });
  Object.defineProperty(window, "Notification", { value: class {}, configurable: true });

  // Deleted, not set back to undefined: isPushSupported uses `in`, and a
  // property that exists with the value undefined would still read as present.
  const restore = (target: object, key: string, original: unknown) => {
    if (original === undefined) delete (target as Record<string, unknown>)[key];
    else Object.defineProperty(target, key, { value: original, configurable: true });
  };

  return () => {
    restore(navigator, "serviceWorker", originals.serviceWorker);
    restore(window, "PushManager", originals.pushManager);
    restore(window, "Notification", originals.notification);
  };
}

describe("urlBase64ToUint8Array", () => {
  it("decodes the unpadded base64url the server hands out", () => {
    // "Hello" in base64url, unpadded, is "SGVsbG8".
    expect([...urlBase64ToUint8Array("SGVsbG8")]).toEqual([72, 101, 108, 108, 111]);
  });

  it("restores the padding the encoding drops", () => {
    // 4 bytes needs two padding characters; without re-padding, atob throws and
    // pushManager.subscribe fails with a DOMException that explains nothing.
    expect(urlBase64ToUint8Array("AQIDBA").length).toBe(4);
    expect([...urlBase64ToUint8Array("AQIDBA")]).toEqual([1, 2, 3, 4]);
  });

  it("maps the url-safe alphabet back to standard base64", () => {
    // 0xFB 0xFF encodes as "+/8" in standard base64 and "-_8" in base64url; a
    // decoder that skips this substitution produces silently wrong key bytes.
    expect([...urlBase64ToUint8Array("-_8")]).toEqual([251, 255]);
  });

  it("produces a 65-byte key from a real VAPID public key", () => {
    const key =
      "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8";
    const bytes = urlBase64ToUint8Array(key);

    expect(bytes.length).toBe(65);
    // Uncompressed point marker — a browser rejects anything else.
    expect(bytes[0]).toBe(0x04);
  });
});

describe("resolvePushState", () => {
  let restore: (() => void) | null = null;

  afterEach(() => {
    restore?.();
    restore = null;
  });

  it("is unsupported when the browser has no Push API, whatever the server says", () => {
    // The iPhone-in-a-tab case: Notification exists, PushManager does not.
    expect(resolvePushState(true, true, "granted")).toBe("unsupported");
  });

  it("is unavailable when the server has no VAPID keys", () => {
    restore = pretendPushIsSupported();
    // Offering a prompt here would spend a permission the deployment cannot use.
    expect(resolvePushState(false, false, "default")).toBe("unavailable");
  });

  it("is denied once the browser has been told no", () => {
    restore = pretendPushIsSupported();
    expect(resolvePushState(true, false, "denied")).toBe("denied");
  });

  it("is subscribed only when permission and a subscription both exist", () => {
    restore = pretendPushIsSupported();

    expect(resolvePushState(true, true, "granted")).toBe("subscribed");
    // Permission granted months ago but the subscription is gone (site data
    // cleared): back to the prompt, which re-subscribes without re-asking.
    expect(resolvePushState(true, false, "granted")).toBe("prompt");
  });

  it("falls back to the prompt when nothing has been decided", () => {
    restore = pretendPushIsSupported();
    expect(resolvePushState(true, false, "default")).toBe("prompt");
    expect(resolvePushState(true, false, null)).toBe("prompt");
  });
});

describe("isPushSupported", () => {
  it("is false in an environment without a service worker", () => {
    expect(isPushSupported()).toBe(false);
  });
});

describe("serializeSubscription", () => {
  const subscription = (json: unknown, endpoint = "https://push.example/abc") =>
    ({ endpoint, toJSON: () => json }) as unknown as PushSubscription;

  it("narrows the browser object to the three fields the API wants", () => {
    const result = serializeSubscription(
      subscription({
        endpoint: "https://push.example/abc",
        expirationTime: null,
        keys: { p256dh: "key", auth: "secret" },
      })
    );

    expect(result).toEqual({
      endpoint: "https://push.example/abc",
      keys: { p256dh: "key", auth: "secret" },
    });
  });

  it("falls back to the subscription's own endpoint when toJSON omits it", () => {
    const result = serializeSubscription(
      subscription({ keys: { p256dh: "key", auth: "secret" } }, "https://push.example/xyz")
    );

    expect(result?.endpoint).toBe("https://push.example/xyz");
  });

  it("returns null rather than posting a subscription with no keys", () => {
    // Older engines hand back a keyless subscription; posting it would be
    // rejected server-side with a validation error nobody can act on.
    expect(serializeSubscription(subscription({ endpoint: "https://push.example/abc" }))).toBeNull();
    expect(
      serializeSubscription(subscription({ endpoint: "https://x", keys: { p256dh: "only" } }))
    ).toBeNull();
  });
});

describe("describeBrowser", () => {
  it("labels the common browser and platform pairs", () => {
    expect(
      describeBrowser(
        "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0"
      )
    ).toBe("Firefox on Linux");

    expect(
      describeBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      )
    ).toBe("Safari on iOS");
  });

  it("prefers the more specific engine when several claim Chrome", () => {
    // Edge and Opera both carry "Chrome/" in their UA; the order of the checks
    // is the whole point.
    expect(describeBrowser("Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36 Edg/120")).toBe(
      "Edge on Windows"
    );
    expect(describeBrowser("Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36 OPR/106")).toBe(
      "Opera on Windows"
    );
  });

  it("degrades to the browser's own words rather than to nothing", () => {
    expect(describeBrowser("SomeUnknownAgent/1.0")).toBe("SomeUnknownAgent/1.0");
    expect(describeBrowser("")).toBe("This device");
  });
});

describe("the notification payload contract", () => {
  it("matches what the service worker reads", async () => {
    // push-sw.js is plain JS in public/ and never bundled, so this pins the one
    // thing that could silently drift: the field names the server sends.
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const source = await readFile(resolve(process.cwd(), "public/push-sw.js"), "utf8");

    for (const field of ["title", "body", "url", "tag"]) {
      expect(source).toContain(`payload.${field}`);
    }
    // And that a payload-less push still shows something, or Chrome substitutes
    // its own "this site has been updated in the background".
    expect(source).toContain("FALLBACK");
  });
});
