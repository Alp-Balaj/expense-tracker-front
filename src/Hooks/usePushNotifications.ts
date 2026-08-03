import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  describeBrowser,
  isPushSupported,
  resolvePushState,
  serializeSubscription,
  urlBase64ToUint8Array,
  type PushState,
} from "@/lib/push";
import {
  getPushConfigurationApi,
  getPushDevicesApi,
  sendTestPushApi,
  subscribePushApi,
  unsubscribePushApi,
  type PushDevice,
} from "@/Services/pushServices";

/**
 * Everything the notifications screen needs, in one place.
 *
 * The awkwardness this hook absorbs is that a push subscription lives in three
 * systems at once — the browser's permission, the service worker's subscription,
 * and our database row — and any of them can be true while the others are not.
 * A browser that was granted permission months ago still has none of our rows
 * after a database reset; a user who cleared site data still has our row. So the
 * browser is treated as the source of truth for what exists, and every read
 * reconciles the server to it.
 */
export function usePushNotifications(enabled: boolean) {
  const [state, setState] = useState<PushState>("unsupported");
  const [devices, setDevices] = useState<PushDevice[]>([]);
  const [busy, setBusy] = useState(false);

  const publicKey = useRef<string | null>(null);
  // Guards against setting state after the settings dialog has been closed.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const currentSubscription = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isPushSupported()) return null;
    // Not `serviceWorker.ready`: that promise simply never settles when nothing
    // is registered, which is the normal case in local dev (the worker is only
    // built for production), and it would hang this hook for ever.
    const registration = await navigator.serviceWorker.getRegistration();
    return (await registration?.pushManager.getSubscription()) ?? null;
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    if (!isPushSupported()) {
      setState("unsupported");
      return;
    }

    try {
      const configuration = await getPushConfigurationApi();
      publicKey.current = configuration.publicKey;

      const subscription = await currentSubscription();
      const resolved = resolvePushState(
        configuration.available,
        subscription !== null,
        Notification.permission
      );

      if (!alive.current) return;
      setState(resolved);
      setDevices(resolved === "subscribed" ? await getPushDevicesApi(subscription?.endpoint) : []);
    } catch (error) {
      console.error("Failed to read push configuration", error);
      if (alive.current) setState("unavailable");
    }
  }, [enabled, currentSubscription]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!isPushSupported() || !publicKey.current) return;

    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "prompt");
        // Not an error worth a toast: the browser will never ask again, and
        // saying so is the only useful thing left.
        if (permission === "denied") {
          toast.error("Notifications are blocked for this site in your browser settings.");
        }
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        toast.error("This browser has not installed the app yet.");
        return;
      }

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          // Required by every browser, and the reason the public key is fetched
          // before the prompt is ever shown.
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey.current),
        }));

      const serialized = serializeSubscription(subscription);
      if (!serialized) {
        toast.error("This browser returned a subscription without keys.");
        return;
      }

      await subscribePushApi(serialized, describeBrowser(navigator.userAgent));
      await refresh();
      toast.success("Notifications are on.");
    } catch (error) {
      console.error("Failed to enable notifications", error);
      toast.error("Could not turn on notifications.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }, [refresh]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const subscription = await currentSubscription();

      // Tell the server first: if the browser-side unsubscribe succeeds and the
      // call fails, the row survives with an endpoint nothing will ever accept,
      // and we would keep pushing at it until the failure count prunes it.
      if (subscription) {
        await unsubscribePushApi(subscription.endpoint);
        await subscription.unsubscribe();
      }

      await refresh();
      toast.success("Notifications are off.");
    } catch (error) {
      console.error("Failed to disable notifications", error);
      toast.error("Could not turn off notifications.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }, [currentSubscription, refresh]);

  const sendTest = useCallback(async () => {
    setBusy(true);
    try {
      const { delivered } = await sendTestPushApi();
      if (delivered > 0) {
        toast.success(`Sent to ${delivered} device${delivered === 1 ? "" : "s"}.`);
      } else {
        toast.error("No device accepted the notification.");
      }
    } catch (error) {
      console.error("Failed to send a test notification", error);
      toast.error("Could not send a test notification.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }, []);

  return { state, devices, busy, enable, disable, sendTest, refresh };
}
