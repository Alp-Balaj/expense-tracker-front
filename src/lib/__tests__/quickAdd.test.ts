import { describe, expect, it } from "vitest";

import { lastUsedAccountId, rankCategoriesByUsage } from "@/lib/quickAdd";
import { CategoryType } from "@/Enums/enums";
import type { Category } from "@/Models/Category";
import type { Expense } from "@/Models/Expense";

// The /add screen's prefills are pure derivations over the cached expense
// list; these pin the ranking rules down.

const cat = (id: string, name: string): Category =>
  ({
    id,
    name,
    categoryType: CategoryType.Expense,
    color: "#c96442",
    description: "",
  }) as Category;

const expense = (
  id: string,
  categoryId: string,
  accountId: string,
  date: string
): Expense => ({
  id,
  title: id,
  amount: 10,
  date,
  description: "",
  accountId,
  categoryId,
});

const categories = [cat("cat-a", "Alpha"), cat("cat-b", "Beta"), cat("cat-c", "Gamma")];

describe("rankCategoriesByUsage", () => {
  it("puts the most-used category first", () => {
    const expenses = [
      expense("e1", "cat-b", "acc-1", "2026-07-01"),
      expense("e2", "cat-b", "acc-1", "2026-07-02"),
      expense("e3", "cat-a", "acc-1", "2026-07-03"),
    ];

    const ranked = rankCategoriesByUsage(categories, expenses);
    expect(ranked.map((c) => c.id)).toEqual(["cat-b", "cat-a", "cat-c"]);
  });

  it("breaks count ties by most recent use", () => {
    const expenses = [
      expense("e1", "cat-a", "acc-1", "2026-07-01"),
      expense("e2", "cat-b", "acc-1", "2026-07-10"),
    ];

    const ranked = rankCategoriesByUsage(categories, expenses);
    expect(ranked.map((c) => c.id)).toEqual(["cat-b", "cat-a", "cat-c"]);
  });

  it("keeps unused categories in their original order at the end", () => {
    const expenses = [expense("e1", "cat-c", "acc-1", "2026-07-01")];

    const ranked = rankCategoriesByUsage(categories, expenses);
    expect(ranked.map((c) => c.id)).toEqual(["cat-c", "cat-a", "cat-b"]);
  });

  it("never drops or invents categories", () => {
    const ranked = rankCategoriesByUsage(categories, []);
    expect(ranked.map((c) => c.id)).toEqual(["cat-a", "cat-b", "cat-c"]);
  });

  it("only counts usage inside the recent window", () => {
    // 100 recent cat-b entries push a lone, older cat-a burst out of the window.
    const old = Array.from({ length: 5 }, (_, i) =>
      expense(`old-${i}`, "cat-a", "acc-1", "2025-01-01")
    );
    const recent = Array.from({ length: 100 }, (_, i) =>
      expense(`new-${i}`, "cat-b", "acc-1", "2026-06-15")
    );

    const ranked = rankCategoriesByUsage(categories, [...old, ...recent]);
    expect(ranked[0].id).toBe("cat-b");
    // cat-a fell out of the window entirely → ranked as unused, original order.
    expect(ranked.map((c) => c.id)).toEqual(["cat-b", "cat-a", "cat-c"]);
  });
});

describe("lastUsedAccountId", () => {
  it("returns the account of the newest expense regardless of array order", () => {
    const expenses = [
      expense("e1", "cat-a", "acc-old", "2026-06-01"),
      expense("e3", "cat-a", "acc-new", "2026-07-20"),
      expense("e2", "cat-a", "acc-mid", "2026-07-01"),
    ];

    expect(lastUsedAccountId(expenses)).toBe("acc-new");
  });

  it("returns empty string with no history", () => {
    expect(lastUsedAccountId([])).toBe("");
  });
});
