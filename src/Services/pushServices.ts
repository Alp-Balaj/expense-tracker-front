import { getAllDataApi, postDataApi } from "./apiServices";
import type { SerializedSubscription } from "@/lib/push";

export const PUSH_API = "api/Push";

/** What the server can tell us before the browser is asked for anything. */
export interface PushConfiguration {
  available: boolean;
  publicKey: string | null;
}

export interface PushDevice {
  id: string;
  userAgent: string | null;
  createdAt: string;
  lastSuccessAtUtc: string | null;
  isCurrentDevice: boolean;
}

export const getPushConfigurationApi = () =>
  getAllDataApi<PushConfiguration>(`${PUSH_API}/configuration`);

export const getPushDevicesApi = (currentEndpoint?: string) =>
  getAllDataApi<PushDevice[]>(
    currentEndpoint
      ? `${PUSH_API}/devices?endpoint=${encodeURIComponent(currentEndpoint)}`
      : `${PUSH_API}/devices`
  );

export const subscribePushApi = (
  subscription: SerializedSubscription,
  userAgent?: string
) => postDataApi<PushDevice>(`${PUSH_API}/subscribe`, { ...subscription, userAgent });

export const unsubscribePushApi = (endpoint: string) =>
  postDataApi<{ removed: boolean }>(`${PUSH_API}/unsubscribe`, { endpoint });

export const sendTestPushApi = () =>
  postDataApi<{ delivered: number }>(`${PUSH_API}/test`, {});
