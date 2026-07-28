import { describe, expect, it } from "vitest";

import {
  EMPTY_LIST_FILTERS,
  activeFilterCount,
  applyListFilters,
  toggleId,
  type ListFilters,
} from "@/lib/listFilters";

const rows = [
  { id: "1", categoryId: "food", accountId: "checking", amount: 50 },
  { id: "2", categoryId: "home", accountId: "checking", amount: 1200 },
  { id: "3", categoryId: "fun", accountId: "cash", amount: 15 },
  { id: "4", categoryId: "food", accountId: "cash", amount: 300 },
];

const filters = (partial: Partial<ListFilters>): ListFilters => ({
  ...EMPTY_LIST_FILTERS,
  ...partial,
});

describe("applyListFilters", () => {
  it("returns every row when nothing is selected", () => {
    expect(applyListFilters(rows, EMPTY_LIST_FILTERS)).toHaveLength(4);
  });

  it("keeps only the chosen categories", () => {
    const result = applyListFilters(rows, filters({ categoryIds: ["food"] }));
    expect(result.map((r) => r.id)).toEqual(["1", "4"]);
  });

  // An empty selection must mean "no filter", never "match nothing" — the
  // difference between an untouched control and an empty table.
  it("ORs the options within one facet", () => {
    const result = applyListFilters(rows, filters({ categoryIds: ["food", "fun"] }));
    expect(result.map((r) => r.id)).toEqual(["1", "3", "4"]);
  });

  it("ANDs across facets", () => {
    const result = applyListFilters(
      rows,
      filters({ categoryIds: ["food"], accountIds: ["cash"] }),
    );
    expect(result.map((r) => r.id)).toEqual(["4"]);
  });

  it("filters by a minimum amount alone", () => {
    const result = applyListFilters(rows, filters({ amount: [100, undefined] }));
    expect(result.map((r) => r.id)).toEqual(["2", "4"]);
  });

  it("filters by a maximum amount alone", () => {
    const result = applyListFilters(rows, filters({ amount: [undefined, 100] }));
    expect(result.map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("treats both amount bounds as inclusive", () => {
    const result = applyListFilters(rows, filters({ amount: [50, 300] }));
    expect(result.map((r) => r.id)).toEqual(["1", "4"]);
  });

  it("combines an amount range with a facet", () => {
    const result = applyListFilters(
      rows,
      filters({ categoryIds: ["food"], amount: [100, undefined] }),
    );
    expect(result.map((r) => r.id)).toEqual(["4"]);
  });
});

describe("toggleId", () => {
  it("adds and removes without disturbing the rest", () => {
    expect(toggleId(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("activeFilterCount", () => {
  it("counts each set facet once", () => {
    expect(activeFilterCount(EMPTY_LIST_FILTERS)).toBe(0);
    expect(activeFilterCount(filters({ categoryIds: ["food", "fun"] }))).toBe(1);
    expect(
      activeFilterCount(filters({ categoryIds: ["food"], accountIds: ["cash"] })),
    ).toBe(2);
    expect(
      activeFilterCount(
        filters({ categoryIds: ["food"], accountIds: ["cash"], amount: [1, undefined] }),
      ),
    ).toBe(3);
  });

  it("counts a half-open range as active", () => {
    expect(activeFilterCount(filters({ amount: [undefined, 10] }))).toBe(1);
    expect(activeFilterCount(filters({ amount: [10, undefined] }))).toBe(1);
  });
});
