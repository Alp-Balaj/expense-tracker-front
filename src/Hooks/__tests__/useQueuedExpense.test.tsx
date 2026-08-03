import "fake-indexeddb/auto";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useQueuedCreateExpense } from "@/Hooks/useQueuedExpense";
import { useOutbox } from "@/Hooks/useOutbox";
import { queryKeys } from "@/Hooks/queries/queryKeys";
import { api } from "@/Services/api";
import { clear, pending, resetForTests } from "@/lib/outbox";
import type { Expense } from "@/Models/Expense";

// The decision this stream turns on: which failures are "the network isn't
// there, hold onto it" and which are "the server said no, tell the user". Get
// that wrong in either direction and the feature is worse than not having it —
// queueing a rejected write means it fails again later with no one watching,
// and failing a lost-response write means a lost expense.

vi.mock("@/Services/api", () => ({
  api: { post: vi.fn() },
}));

const draft: Expense = {
  id: null,
  title: "Coffee",
  amount: 3.5,
  date: "2026-08-03",
  description: "",
  accountId: "acc-1",
  categoryId: "cat-1",
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** An axios error with a response — the server was reached and answered. */
function serverRefusal(status: number) {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "Bad Request",
    data: "Category not found",
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  });
}

/** An axios error with no response — the request never landed, or the reply was lost. */
function networkFailure() {
  return new AxiosError("Network Error", "ERR_NETWORK");
}

describe("useQueuedCreateExpense", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetForTests();
    await clear();
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("posts straight through when the network is there", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: "server-1" } });

    const { result } = renderHook(() => useQueuedCreateExpense(), { wrapper });
    const outcome = await result.current(draft);

    expect(outcome).toBe("sent");
    expect(await pending()).toEqual([]);
  });

  it("sends an idempotency key even on the happy path", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useQueuedCreateExpense(), { wrapper });
    await result.current(draft);

    // The one case this covers that nothing else does: the reply is lost *after*
    // the server applied it. Only a key sent on the first attempt makes the
    // retry safe.
    const [, , config] = vi.mocked(api.post).mock.calls[0];
    expect((config as { headers: Record<string, string> }).headers["Idempotency-Key"]).toMatch(
      /^[0-9a-f-]{36}$/i
    );
  });

  it("queues without even trying when the browser says it is offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    const { result } = renderHook(() => useQueuedCreateExpense(), { wrapper });
    const outcome = await result.current(draft);

    expect(outcome).toBe("queued");
    expect(api.post).not.toHaveBeenCalled();
    expect(await pending()).toHaveLength(1);
  });

  it("queues when the request gets no response, however optimistic navigator.onLine is", async () => {
    // Hotel wifi that has associated but not authenticated: onLine says true and
    // nothing reaches the server. This is why onLine is only trusted when false.
    vi.mocked(api.post).mockRejectedValue(networkFailure());

    const { result } = renderHook(() => useQueuedCreateExpense(), { wrapper });
    const outcome = await result.current(draft);

    expect(outcome).toBe("queued");
    expect(await pending()).toHaveLength(1);
  });

  it("does not queue a write the server refused", async () => {
    vi.mocked(api.post).mockRejectedValue(serverRefusal(400));

    const { result } = renderHook(() => useQueuedCreateExpense(), { wrapper });

    // Queueing it would hide a real error and retry it, silently, until it gave
    // up — with the expense lost either way.
    await expect(result.current(draft)).rejects.toThrow();
    expect(await pending()).toEqual([]);
  });

  it("shows the queued expense immediately, marked as not yet saved", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useQueuedCreateExpense(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

    await result.current(draft);

    const cached = client.getQueryData<Expense[]>(queryKeys.expenses);
    expect(cached).toHaveLength(1);
    expect(cached?.[0].title).toBe("Coffee");
    // Marked, because an unmarked provisional row is a lie about money.
    expect(cached?.[0].pending).toBe(true);
    // ... and carrying the queue id, so the drain can replace exactly this row.
    expect(cached?.[0].id).toEqual((await pending())[0].id);
  });
});

describe("useOutbox", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetForTests();
    await clear();
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("drains the queue when the network comes back", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    const create = renderHook(() => useQueuedCreateExpense(), { wrapper });
    await create.result.current(draft);
    await create.result.current({ ...draft, title: "Bus fare" });
    expect(await pending()).toHaveLength(2);

    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useOutbox(), { wrapper });
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));

    await waitFor(async () => expect(await pending()).toEqual([]));
    await waitFor(() => expect(result.current.pendingCount).toBe(0));
  });

  it("replays every entry with the key it was queued under", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const create = renderHook(() => useQueuedCreateExpense(), { wrapper });
    await create.result.current(draft);

    const [queued] = await pending();

    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    renderHook(() => useOutbox(), { wrapper });
    await waitFor(() => expect(api.post).toHaveBeenCalled());

    const [, , config] = vi.mocked(api.post).mock.calls[0];
    expect((config as { headers: Record<string, string> }).headers["Idempotency-Key"]).toBe(
      queued.id
    );
  });

  it("stops the drain rather than burning every entry against a dead network", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const create = renderHook(() => useQueuedCreateExpense(), { wrapper });
    await create.result.current(draft);
    await create.result.current({ ...draft, title: "Bus fare" });
    await create.result.current({ ...draft, title: "Sandwich" });

    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    vi.mocked(api.post).mockRejectedValue(networkFailure());

    renderHook(() => useOutbox(), { wrapper });

    // One attempt, then stop: three failures against the same absent network
    // costs three entries a retry each and proves nothing.
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    await waitFor(async () => expect((await pending())[0].attempts).toBe(1));
    expect(await pending()).toHaveLength(3);
  });

  it("surfaces an entry the server permanently refused", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const create = renderHook(() => useQueuedCreateExpense(), { wrapper });
    await create.result.current(draft);

    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    vi.mocked(api.post).mockRejectedValue(serverRefusal(400));

    const { result } = renderHook(() => useOutbox(), { wrapper });

    await waitFor(() => expect(result.current.stuck).toHaveLength(1));
    // Not silently dropped, and not retried for ever — surfaced.
    expect(result.current.pendingCount).toBe(0);
    expect(await pending()).toHaveLength(1);
  });

  it("shows what is queued even while offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const create = renderHook(() => useQueuedCreateExpense(), { wrapper });
    await create.result.current(draft);

    const { result } = renderHook(() => useOutbox(), { wrapper });

    // Caught by the browser pass: an expense logged in a basement queued
    // correctly and the app showed nothing, because the drain returned early
    // before reading the queue. Offline is when the indicator matters most.
    await waitFor(() => expect(result.current.pendingCount).toBe(1));
    expect(api.post).not.toHaveBeenCalled();
  });

  it("two mounted consumers drain the queue once between them", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const create = renderHook(() => useQueuedCreateExpense(), { wrapper });
    await create.result.current(draft);

    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    // The indicator is rendered in both the desktop and the mobile top bar, so
    // two instances mount. A per-instance guard could not see the other drain,
    // and the browser pass showed the second one earning a 409.
    renderHook(() => useOutbox(), { wrapper });
    renderHook(() => useOutbox(), { wrapper });

    await waitFor(async () => expect(await pending()).toEqual([]));
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("waits rather than racing when the server says the first attempt is still running", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const create = renderHook(() => useQueuedCreateExpense(), { wrapper });
    await create.result.current(draft);

    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    vi.mocked(api.post).mockRejectedValue(serverRefusal(409));

    const { result } = renderHook(() => useOutbox(), { wrapper });
    await waitFor(() => expect(api.post).toHaveBeenCalled());

    // A 409 is the idempotency filter saying "come back" — the entry stays
    // replayable rather than being marked as failed.
    await waitFor(async () => expect((await pending())[0].needsAttention).toBe(false));
    expect(result.current.stuck).toHaveLength(0);
  });
});
