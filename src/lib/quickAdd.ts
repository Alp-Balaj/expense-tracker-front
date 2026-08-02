import type { Category } from "@/Models/Category";
import type { Expense } from "@/Models/Expense";

/**
 * Derivations behind the /add quick-add screen: everything it prefills is
 * inferred client-side from the already-cached expense list, so a log entry
 * is usually amount + one or two taps.
 */

/** How many of the newest expenses count as "recent" for usage ranking. */
const RECENT_WINDOW = 100;

/** Newest-first by date string ("yyyy-MM-dd" sorts lexically); stable for ties. */
function newestFirst(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/**
 * Categories reordered by how often they were used in the most recent
 * expenses: most-used first, ties broken by most recently used, and
 * categories with no recent usage keep their original relative order at
 * the end. Returns a new array; never drops a category.
 */
export function rankCategoriesByUsage(
  categories: Category[],
  expenses: Expense[]
): Category[] {
  const recent = newestFirst(expenses).slice(0, RECENT_WINDOW);

  const count = new Map<string, number>();
  const lastUsed = new Map<string, string>();
  for (const e of recent) {
    if (!e.categoryId) continue;
    count.set(e.categoryId, (count.get(e.categoryId) ?? 0) + 1);
    const prev = lastUsed.get(e.categoryId);
    if (!prev || e.date > prev) lastUsed.set(e.categoryId, e.date);
  }

  return categories
    .map((category, index) => ({ category, index }))
    .sort((a, b) => {
      const countDiff =
        (count.get(b.category.id) ?? 0) - (count.get(a.category.id) ?? 0);
      if (countDiff !== 0) return countDiff;
      const aLast = lastUsed.get(a.category.id) ?? "";
      const bLast = lastUsed.get(b.category.id) ?? "";
      if (aLast !== bLast) return aLast > bLast ? -1 : 1;
      return a.index - b.index; // stable: unused categories keep their order
    })
    .map(({ category }) => category);
}

/** The account the newest expense was paid from, or "" with no history. */
export function lastUsedAccountId(expenses: Expense[]): string {
  return newestFirst(expenses)[0]?.accountId ?? "";
}

// #region Merchant memory

/** One remembered merchant: a repeated expense title and its usual shape. */
export type MerchantEntry = {
  /** Display title, in its most recent casing. */
  title: string;
  /** How often this title appears in the history. */
  count: number;
  /** Newest "yyyy-MM-dd" this title was logged. */
  lastDate: string;
  /** The category this title is most often filed under (ties → most recent). */
  categoryId: string;
  /** Typical amount: the median of the observed amounts (always a real one). */
  amount: number;
};

/**
 * Client-side index of previous expense titles ("merchant memory"): groups
 * the history by normalized title and remembers each one's usual category
 * and typical amount, so picking a suggestion refills the whole entry.
 */
export function buildMerchantIndex(expenses: Expense[]): MerchantEntry[] {
  type Group = {
    title: string;
    lastDate: string;
    amounts: number[];
    perCategory: Map<string, { count: number; lastDate: string }>;
  };

  const groups = new Map<string, Group>();
  for (const e of newestFirst(expenses)) {
    const title = e.title.trim();
    if (!title) continue;
    const key = title.toLowerCase();

    let group = groups.get(key);
    if (!group) {
      // First hit is the newest occurrence → keeps the most recent casing.
      group = { title, lastDate: e.date, amounts: [], perCategory: new Map() };
      groups.set(key, group);
    }
    group.amounts.push(e.amount);
    if (e.categoryId) {
      const cat = group.perCategory.get(e.categoryId) ?? { count: 0, lastDate: "" };
      cat.count += 1;
      if (e.date > cat.lastDate) cat.lastDate = e.date;
      group.perCategory.set(e.categoryId, cat);
    }
  }

  return [...groups.values()].map((group) => {
    let categoryId = "";
    let best = { count: 0, lastDate: "" };
    for (const [id, stats] of group.perCategory) {
      if (
        stats.count > best.count ||
        (stats.count === best.count && stats.lastDate > best.lastDate)
      ) {
        categoryId = id;
        best = stats;
      }
    }

    const sorted = [...group.amounts].sort((a, b) => a - b);
    const amount = sorted[Math.floor((sorted.length - 1) / 2)] ?? 0;

    return {
      title: group.title,
      count: group.amounts.length,
      lastDate: group.lastDate,
      categoryId,
      amount,
    };
  });
}

/**
 * Titles matching what was typed so far: prefix matches rank before
 * substring matches, then by frequency, then by recency. Empty input
 * suggests nothing — the dropdown only appears once typing starts.
 */
export function suggestMerchants(
  index: MerchantEntry[],
  query: string,
  limit = 5
): MerchantEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const score = (entry: MerchantEntry): number => {
    const title = entry.title.toLowerCase();
    if (title === q) return 0; // already typed in full — nothing to add
    if (title.startsWith(q)) return 2;
    return title.includes(q) ? 1 : 0;
  };

  return index
    .map((entry) => ({ entry, s: score(entry) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => {
      if (a.s !== b.s) return b.s - a.s;
      if (a.entry.count !== b.entry.count) return b.entry.count - a.entry.count;
      if (a.entry.lastDate !== b.entry.lastDate)
        return a.entry.lastDate > b.entry.lastDate ? -1 : 1;
      return a.entry.title.localeCompare(b.entry.title);
    })
    .slice(0, limit)
    .map(({ entry }) => entry);
}

// #endregion
