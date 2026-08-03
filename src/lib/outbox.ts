/**
 * The offline outbox: writes that were typed but not yet accepted by the server.
 *
 * <h3>Why IndexedDB and not localStorage</h3>
 * These are pending financial records, not a preference. localStorage is
 * synchronous (it blocks the main thread on every write, on a phone, in the
 * middle of typing), has a ~5 MB ceiling shared with everything else, and is
 * cleared by "clear site data" in the same breath as a cache. IndexedDB is
 * async, is the store a service worker can also reach, and is what the platform
 * actually offers for durable structured data.
 *
 * <h3>The one invariant</h3>
 * Every entry carries an `idempotencyKey` minted when the expense was *typed*,
 * never when it is sent. That ordering is the entire replay contract: a key
 * generated at send time would differ on every retry and guarantee nothing, so
 * the server could not tell a retry from a second coffee.
 */

const DB_NAME = "expensetracker-outbox";
const DB_VERSION = 1;
const STORE = "writes";

/** Past this many failures an entry stops retrying and waits for the user. */
export const MAX_ATTEMPTS = 8;

export interface OutboxEntry<T = unknown> {
  /** Also the Idempotency-Key sent to the server. Minted at typing time. */
  id: string;
  /** e.g. "api/Expense". Kept per entry so the queue is not expense-only by construction. */
  endpoint: string;
  /** The request body, exactly as the online path would have sent it. */
  payload: T;
  createdAt: number;
  attempts: number;
  lastAttemptAt: number | null;
  /** Why the last attempt failed, for the UI to show when it gives up. */
  lastError: string | null;
  /** True once the server refused it in a way retrying cannot fix (4xx). */
  needsAttention: boolean;
}

/**
 * Opened lazily and cached. Environments without IndexedDB (an old browser, a
 * hostile privacy mode) resolve to null and every operation below degrades to a
 * no-op — the app must still work, it just cannot queue.
 */
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        // Replay is oldest-first so the account's history goes in the order it
        // was lived, not the order the queue happened to enumerate.
        store.createIndex("createdAt", "createdAt");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function database(): Promise<IDBDatabase | null> {
  dbPromise ??= openDatabase();
  return dbPromise;
}

function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | null> {
  return database().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }

        try {
          const transaction = db.transaction(STORE, mode);
          const request = action(transaction.objectStore(STORE));
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      })
  );
}

/**
 * Queues a write. The id is the caller's, because it is also the idempotency
 * key and has to have existed before the first send attempt.
 */
export async function enqueue<T>(id: string, endpoint: string, payload: T): Promise<OutboxEntry<T>> {
  const entry: OutboxEntry<T> = {
    id,
    endpoint,
    payload,
    createdAt: Date.now(),
    attempts: 0,
    lastAttemptAt: null,
    lastError: null,
    needsAttention: false,
  };

  await run("readwrite", (store) => store.put(entry));
  return entry;
}

/** Everything still waiting, oldest first. */
export async function pending(): Promise<OutboxEntry[]> {
  const all = (await run<OutboxEntry[]>("readonly", (store) => store.getAll())) ?? [];
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function remove(id: string): Promise<void> {
  await run("readwrite", (store) => store.delete(id));
}

/**
 * Records a failed attempt. `permanent` marks a refusal retrying cannot fix — a
 * 400 for a category that has since been deleted, say — which stops the entry
 * burning retries and surfaces it for the user instead.
 */
export async function recordFailure(
  id: string,
  error: string,
  permanent = false
): Promise<OutboxEntry | null> {
  const existing = await run<OutboxEntry>("readonly", (store) => store.get(id));
  if (!existing) return null;

  const attempts = existing.attempts + 1;
  const updated: OutboxEntry = {
    ...existing,
    attempts,
    lastAttemptAt: Date.now(),
    lastError: error,
    needsAttention: permanent || attempts >= MAX_ATTEMPTS,
  };

  await run("readwrite", (store) => store.put(updated));
  return updated;
}

/** Entries worth sending right now — everything except the ones that gave up. */
export function replayable(entries: OutboxEntry[]): OutboxEntry[] {
  return entries.filter((entry) => !entry.needsAttention);
}

/** Clears the whole queue. Only the "discard these" affordance uses it. */
export async function clear(): Promise<void> {
  await run("readwrite", (store) => store.clear());
}

/** Test seam: forgets the cached connection so a fresh database can be opened. */
export function resetForTests(): void {
  dbPromise = null;
}
