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
