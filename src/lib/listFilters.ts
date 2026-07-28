/**
 * The category / account / amount filters the expense and income pages apply.
 *
 * These live on the *page*, not inside the table, because the acceptance
 * criterion is that a filter reads consistently everywhere: picking a category
 * has to move the summary cards and the charts, not just the rows. Table-local
 * column-filter state cannot reach those surfaces, so the page filters the
 * rows once and hands the same slice to all three.
 *
 * Pure and dependency-free, so it is unit-testable without a table or a DOM.
 */

/** `[min, max]`, either end optional. */
export type AmountRange = [number | undefined, number | undefined];

export type ListFilters = {
  categoryIds: string[];
  accountIds: string[];
  amount: AmountRange;
};

/** A row that can be filtered — expenses and incomes share this shape. */
export type FilterableRow = {
  categoryId: string;
  accountId: string;
  amount: number;
};

export const EMPTY_LIST_FILTERS: ListFilters = {
  categoryIds: [],
  accountIds: [],
  amount: [undefined, undefined],
};

/** Adds or removes one id from a multi-select, leaving the rest alone. */
export function toggleId(selected: string[], id: string): string[] {
  return selected.includes(id)
    ? selected.filter((value) => value !== id)
    : [...selected, id];
}

function matchesAmount(value: number, [min, max]: AmountRange): boolean {
  if (min == null && max == null) return true;
  if (!Number.isFinite(value)) return false;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

/**
 * Keeps the rows matching every active filter. Within one filter the chosen
 * options are OR-ed (Food *or* Rent); across filters they are AND-ed. An empty
 * selection means "no filter", never "match nothing".
 */
export function applyListFilters<T extends FilterableRow>(
  rows: T[],
  filters: ListFilters,
): T[] {
  const { categoryIds, accountIds, amount } = filters;
  if (
    categoryIds.length === 0 &&
    accountIds.length === 0 &&
    amount[0] == null &&
    amount[1] == null
  ) {
    return rows;
  }

  return rows.filter(
    (row) =>
      (categoryIds.length === 0 || categoryIds.includes(row.categoryId)) &&
      (accountIds.length === 0 || accountIds.includes(row.accountId)) &&
      matchesAmount(row.amount, amount),
  );
}

/** How many of the three filters are set — the badge on the Filter button. */
export function activeFilterCount(filters: ListFilters): number {
  let count = 0;
  if (filters.categoryIds.length > 0) count += 1;
  if (filters.accountIds.length > 0) count += 1;
  if (filters.amount[0] != null || filters.amount[1] != null) count += 1;
  return count;
}
