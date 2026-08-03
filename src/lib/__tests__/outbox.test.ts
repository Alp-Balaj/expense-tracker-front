import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

import {
  MAX_ATTEMPTS,
  clear,
  enqueue,
  pending,
  recordFailure,
  remove,
  replayable,
  resetForTests,
} from "@/lib/outbox";

// Stream O's queue, against a real IndexedDB implementation rather than a
// stand-in: the store is where pending financial records live between being
// typed and being accepted, and an in-memory fake would prove nothing about the
// thing that actually persists them.

describe("outbox", () => {
  beforeEach(async () => {
    resetForTests();
    await clear();
  });

  it("starts empty", async () => {
    expect(await pending()).toEqual([]);
  });

  it("keeps the id it was given, because that id is the idempotency key", async () => {
    // Minted when the expense was typed, not when it is sent — the whole replay
    // contract rests on it surviving unchanged.
    await enqueue("key-1", "api/Expense", { title: "Coffee", amount: 3.5 });

    const [entry] = await pending();
    expect(entry.id).toBe("key-1");
    expect(entry.endpoint).toBe("api/Expense");
    expect(entry.payload).toEqual({ title: "Coffee", amount: 3.5 });
    expect(entry.attempts).toBe(0);
    expect(entry.needsAttention).toBe(false);
  });

  it("returns entries oldest first", async () => {
    await enqueue("a", "api/Expense", { n: 1 });
    await new Promise((r) => setTimeout(r, 2));
    await enqueue("b", "api/Expense", { n: 2 });
    await new Promise((r) => setTimeout(r, 2));
    await enqueue("c", "api/Expense", { n: 3 });

    // Replayed in the order they were lived, not the order the store enumerates.
    expect((await pending()).map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("survives being reopened", async () => {
    await enqueue("durable", "api/Expense", { title: "Bus fare" });

    // A phone in a basement gets closed and reopened; the queue is the only
    // record of that expense.
    resetForTests();

    expect((await pending()).map((e) => e.id)).toEqual(["durable"]);
  });

  it("removes an entry once it lands", async () => {
    await enqueue("sent", "api/Expense", {});
    await remove("sent");

    expect(await pending()).toEqual([]);
  });

  it("counts attempts and keeps the reason", async () => {
    await enqueue("flaky", "api/Expense", {});

    const first = await recordFailure("flaky", "Could not reach the server.");
    expect(first?.attempts).toBe(1);
    expect(first?.lastError).toBe("Could not reach the server.");
    // A transient failure must not take the entry out of the queue — that is
    // the whole point of queueing it.
    expect(first?.needsAttention).toBe(false);
  });

  it("gives up after enough transient failures", async () => {
    await enqueue("hopeless", "api/Expense", {});

    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
      const entry = await recordFailure("hopeless", "nope");
      expect(entry?.needsAttention).toBe(false);
    }

    const final = await recordFailure("hopeless", "nope");
    expect(final?.attempts).toBe(MAX_ATTEMPTS);
    // Retrying for ever against something that will never accept it is how a
    // queue becomes a battery drain nobody can see.
    expect(final?.needsAttention).toBe(true);
  });

  it("stops immediately on a refusal retrying cannot fix", async () => {
    await enqueue("rejected", "api/Expense", {});

    // A 400 — the category was deleted on another device. Eight more attempts
    // would all be 400s.
    const entry = await recordFailure("rejected", "Bad Request", true);

    expect(entry?.attempts).toBe(1);
    expect(entry?.needsAttention).toBe(true);
  });

  it("excludes the given-up entries from a replay, without deleting them", async () => {
    await enqueue("good", "api/Expense", {});
    await enqueue("bad", "api/Expense", {});
    await recordFailure("bad", "Bad Request", true);

    const all = await pending();
    expect(all).toHaveLength(2);
    // They stay so the UI can say "1 couldn't be saved" rather than losing it.
    expect(replayable(all).map((e) => e.id)).toEqual(["good"]);
  });

  it("recording a failure for an entry that already landed is harmless", async () => {
    // The drain removed it, then a stale retry reports on it.
    expect(await recordFailure("ghost", "nope")).toBeNull();
  });

  it("re-enqueuing the same key replaces rather than duplicates", async () => {
    await enqueue("same", "api/Expense", { amount: 1 });
    await enqueue("same", "api/Expense", { amount: 2 });

    const all = await pending();
    expect(all).toHaveLength(1);
    expect((all[0].payload as { amount: number }).amount).toBe(2);
  });
});
