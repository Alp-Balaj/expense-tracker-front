import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NotificationSettings } from "../NotificationSettings";
import type { PushDevice } from "@/Services/pushServices";

/**
 * The four ways push can be unavailable are the substance of this screen: each
 * one has to say something a person can act on, and none of them may leave a
 * "Turn on notifications" button that would spend the browser's one permission
 * prompt on a dead end.
 */
const device = (overrides: Partial<PushDevice> = {}): PushDevice => ({
  id: crypto.randomUUID(),
  userAgent: "Firefox on Linux",
  createdAt: "2026-08-02T10:00:00Z",
  lastSuccessAtUtc: null,
  isCurrentDevice: false,
  ...overrides,
});

function renderSettings(props: Partial<Parameters<typeof NotificationSettings>[0]> = {}) {
  const handlers = {
    onEnable: vi.fn(),
    onDisable: vi.fn(),
    onSendTest: vi.fn(),
  };

  render(
    <NotificationSettings
      state="prompt"
      devices={[]}
      busy={false}
      {...handlers}
      {...props}
    />
  );

  return handlers;
}

describe("NotificationSettings", () => {
  it("always names the three things it will interrupt you about", () => {
    renderSettings();

    // "We'll send you notifications" is the sentence that gets a prompt refused.
    expect(screen.getByText(/budget passes 80%/i)).toBeInTheDocument();
    expect(screen.getByText(/planned bill is due/i)).toBeInTheDocument();
    expect(screen.getByText(/weekly summary/i)).toBeInTheDocument();
  });

  it("offers the prompt only when it can actually lead somewhere", () => {
    renderSettings({ state: "prompt" });
    expect(screen.getByRole("button", { name: /turn on notifications/i })).toBeInTheDocument();
  });

  it("tells an iPhone user to install the app instead of showing a dead button", () => {
    renderSettings({ state: "unsupported" });

    expect(screen.getByText(/add ExpenseTracker to your home screen/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /turn on notifications/i })).not.toBeInTheDocument();
  });

  it("says so when the server has no keys, rather than failing at the prompt", () => {
    renderSettings({ state: "unavailable" });

    expect(screen.getByText(/aren't configured on this server/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /turn on notifications/i })).not.toBeInTheDocument();
  });

  it("explains that a denied permission cannot be re-asked from here", () => {
    renderSettings({ state: "denied" });

    // The browser will never prompt again; the only honest thing left is to say
    // where the setting lives.
    expect(screen.getByText(/won't ask again/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /turn on notifications/i })).not.toBeInTheDocument();
  });

  it("lists the registered devices and marks the one you are on", () => {
    renderSettings({
      state: "subscribed",
      devices: [
        device({ userAgent: "Firefox on Linux", isCurrentDevice: true }),
        device({ userAgent: "Safari on iOS" }),
      ],
    });

    expect(screen.getByText("Firefox on Linux")).toBeInTheDocument();
    expect(screen.getByText("Safari on iOS")).toBeInTheDocument();
    expect(screen.getByText(/this one/i)).toBeInTheDocument();
  });

  it("wires the test and turn-off actions once subscribed", async () => {
    const user = userEvent.setup();
    const handlers = renderSettings({ state: "subscribed", devices: [device()] });

    await user.click(screen.getByRole("button", { name: /send a test/i }));
    await user.click(screen.getByRole("button", { name: /turn off/i }));

    expect(handlers.onSendTest).toHaveBeenCalledOnce();
    expect(handlers.onDisable).toHaveBeenCalledOnce();
  });

  it("disables its actions while one is in flight", () => {
    renderSettings({ state: "subscribed", devices: [device()], busy: true });

    expect(screen.getByRole("button", { name: /send a test/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /turn off/i })).toBeDisabled();
  });
});
