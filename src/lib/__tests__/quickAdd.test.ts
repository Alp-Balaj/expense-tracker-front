import { describe, expect, it } from "vitest";

import {
  buildMerchantIndex,
  lastUsedAccountId,
  rankCategoriesByUsage,
  suggestMerchants,
} from "@/lib/quickAdd";
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

describe("buildMerchantIndex", () => {
  const withAmount = (e: Expense, amount: number, title: string): Expense => ({
    ...e,
    amount,
    title,
  });

  it("groups titles case-insensitively and keeps the most recent casing", () => {
    const index = buildMerchantIndex([
      withAmount(expense("e1", "cat-a", "acc-1", "2026-07-01"), 10, "netflix"),
      withAmount(expense("e2", "cat-a", "acc-1", "2026-07-15"), 12, "Netflix"),
    ]);

    expect(index).toHaveLength(1);
    expect(index[0].title).toBe("Netflix");
    expect(index[0].count).toBe(2);
    expect(index[0].lastDate).toBe("2026-07-15");
  });

  it("remembers the most frequent category and the median amount", () => {
    const index = buildMerchantIndex([
      withAmount(expense("e1", "cat-a", "acc-1", "2026-07-01"), 40, "Groceries"),
      withAmount(expense("e2", "cat-a", "acc-1", "2026-07-08"), 60, "Groceries"),
      withAmount(expense("e3", "cat-b", "acc-1", "2026-07-15"), 500, "Groceries"),
    ]);

    expect(index[0].categoryId).toBe("cat-a"); // 2 vs 1
    expect(index[0].amount).toBe(60); // median resists the 500 outlier
  });

  it("skips expenses with empty titles", () => {
    const index = buildMerchantIndex([
      withAmount(expense("e1", "cat-a", "acc-1", "2026-07-01"), 5, "  "),
    ]);
    expect(index).toHaveLength(0);
  });
});

describe("suggestMerchants", () => {
  const index = buildMerchantIndex([
    { id: "e1", title: "Grocery run", amount: 40, date: "2026-07-01", description: "", accountId: "a", categoryId: "cat-a" },
    { id: "e2", title: "Grocery run", amount: 45, date: "2026-07-10", description: "", accountId: "a", categoryId: "cat-a" },
    { id: "e3", title: "Gross Café", amount: 8, date: "2026-07-12", description: "", accountId: "a", categoryId: "cat-b" },
    { id: "e4", title: "Big grocery haul", amount: 90, date: "2026-07-05", description: "", accountId: "a", categoryId: "cat-a" },
  ]);

  it("suggests nothing for an empty query", () => {
    expect(suggestMerchants(index, "")).toEqual([]);
    expect(suggestMerchants(index, "   ")).toEqual([]);
  });

  it("ranks prefix matches above substring matches, then by frequency", () => {
    const titles = suggestMerchants(index, "gro").map((e) => e.title);
    // Both prefix matches first (Grocery run twice beats Gross Café once),
    // then the substring match.
    expect(titles).toEqual(["Grocery run", "Gross Café", "Big grocery haul"]);
  });

  it("matches case-insensitively", () => {
    const titles = suggestMerchants(index, "GROCERY").map((e) => e.title);
    expect(titles).toEqual(["Grocery run", "Big grocery haul"]);
  });

  it("drops an exact match — nothing left to complete", () => {
    expect(suggestMerchants(index, "Gross Café")).toEqual([]);
    // Other candidates still surface around a suppressed exact match.
    const titles = suggestMerchants(index, "grocery").map((e) => e.title);
    expect(titles).toEqual(["Grocery run", "Big grocery haul"]);
  });

  it("caps the list", () => {
    const many = buildMerchantIndex(
      Array.from({ length: 10 }, (_, i) => ({
        id: `e${i}`,
        title: `Shop ${i}`,
        amount: 5,
        date: "2026-07-01",
        description: "",
        accountId: "a",
        categoryId: "cat-a",
      }))
    );
    expect(suggestMerchants(many, "shop")).toHaveLength(5);
  });
});
