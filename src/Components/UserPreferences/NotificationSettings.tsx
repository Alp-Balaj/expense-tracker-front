import { Bell, BellOff, Monitor, Send } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { usePushNotifications } from "@/Hooks/usePushNotifications";
import type { PushState } from "@/lib/push";
import type { PushDevice } from "@/Services/pushServices";

/**
 * The three things this app is allowed to interrupt you about (decision D3).
 * Listed literally rather than described in the abstract: "we'll send you
 * notifications" is exactly the sentence that gets a permission prompt refused.
 */
const TRIGGERS = [
  "When a budget passes 80%, and again if it goes over.",
  "The evening before a planned bill is due.",
  "A weekly summary of what you spent.",
] as const;

interface NotificationSettingsProps {
  state: PushState;
  devices: PushDevice[];
  busy: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onSendTest: () => void;
}

/**
 * Presentational on purpose: the four ways push can be unavailable are the whole
 * substance of this screen, and each one deserves a sentence a person can act on.
 * The hook that resolves them lives next door.
 */
export function NotificationSettings({
  state,
  devices,
  busy,
  onEnable,
  onDisable,
  onSendTest,
}: NotificationSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Push notifications</Label>
        <p className="text-xs text-muted-foreground">
          Three reasons, and nothing else:
        </p>
        <ul className="space-y-1 pl-4 text-xs text-muted-foreground">
          {TRIGGERS.map((trigger) => (
            <li key={trigger} className="list-disc">
              {trigger}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        {state === "unsupported" && (
          <p className="text-sm text-muted-foreground">
            This browser can't receive push notifications. On an iPhone, add
            ExpenseTracker to your home screen first — iOS only delivers push to an
            installed app.
          </p>
        )}

        {state === "unavailable" && (
          <p className="text-sm text-muted-foreground">
            Push notifications aren't configured on this server yet.
          </p>
        )}

        {state === "denied" && (
          <p className="text-sm text-muted-foreground">
            Notifications are blocked for this site. Your browser won't ask again —
            you'll need to allow them in its site settings.
          </p>
        )}

        {state === "prompt" && (
          <Button
            onClick={onEnable}
            disabled={busy}
            className="w-full bg-primary text-primary-foreground"
          >
            <Bell className="mr-2 h-4 w-4" />
            Turn on notifications
          </Button>
        )}

        {state === "subscribed" && (
          <>
            <div className="space-y-2">
              <Label className="text-xs">This account's devices</Label>
              {devices.length === 0 ? (
                <p className="text-xs text-muted-foreground">No devices registered.</p>
              ) : (
                <ul className="space-y-1">
                  {devices.map((device) => (
                    <li
                      key={device.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Monitor className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{device.userAgent ?? "Unknown device"}</span>
                      {device.isCurrentDevice && (
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-primary">
                          this one
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onSendTest} disabled={busy} className="flex-1">
                <Send className="mr-2 h-4 w-4" />
                Send a test
              </Button>
              <Button variant="outline" onClick={onDisable} disabled={busy} className="flex-1">
                <BellOff className="mr-2 h-4 w-4" />
                Turn off
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The wired version the settings dialog renders. Split out so the states above
 * can be tested without a service worker, which jsdom does not have.
 */
export function NotificationSettingsPanel({ active }: { active: boolean }) {
  const { state, devices, busy, enable, disable, sendTest } = usePushNotifications(active);

  return (
    <NotificationSettings
      state={state}
      devices={devices}
      busy={busy}
      onEnable={() => void enable()}
      onDisable={() => void disable()}
      onSendTest={() => void sendTest()}
    />
  );
}
