import { describe, expect, it } from "vitest";
import {
  barWidth,
  budgetTone,
  budgetsNeedingAttention,
  formatMonth,
  overspend,
  shiftMonth,
} from "@/lib/budget";
import type { BudgetStatus } from "@/Models/Budget";

function status(overrides: Partial<BudgetStatus> = {}): BudgetStatus {
  return {
    id: "1",
    categoryId: "c1",
    categoryName: "Groceries",
    categoryColor: null,
    note: null,
    period: 0,
    month: "2026-07",
    limit: 300,
    spent: 0,
    remaining: 300,
    percentUsed: 0,
    baseCurrency: "EUR",
    subtotals: [],
    hasMissingRates: false,
    ...overrides,
  };
}

describe("budgetTone", () => {
  it("stays green up to and including 80%", () => {
    expect(budgetTone(0)).toBe("under");
    expect(budgetTone(79.9)).toBe("under");
    expect(budgetTone(80)).toBe("under");
  });

  it("warns above 80% and up to the limit", () => {
    // 250 of 300 = 83.33% — the acceptance sketch's amber case.
    expect(budgetTone(83.33)).toBe("warning");
    expect(budgetTone(100)).toBe("warning");
  });

  it("goes red only once the limit is passed", () => {
    expect(budgetTone(100.01)).toBe("over");
    expect(budgetTone(140)).toBe("over");
  });
});

describe("barWidth", () => {
  it("clamps overspend to a full bar", () => {
    expect(barWidth(140)).toBe(100);
    expect(barWidth(100)).toBe(100);
  });

  it("passes partial progress through", () => {
    expect(barWidth(83.33)).toBe(83.33);
  });

  it("floors nonsense values at zero", () => {
    expect(barWidth(-5)).toBe(0);
    expect(barWidth(Number.NaN)).toBe(0);
  });
});

describe("overspend", () => {
  it("is zero while within the limit", () => {
    expect(overspend({ remaining: 50 })).toBe(0);
    expect(overspend({ remaining: 0 })).toBe(0);
  });

  it("reports the overage as a positive amount", () => {
    expect(overspend({ remaining: -42.5 })).toBe(42.5);
  });
});

describe("budgetsNeedingAttention", () => {
  it("returns the three closest to their limit, worst first", () => {
    const statuses = [
      status({ id: "a", percentUsed: 20 }),
      status({ id: "b", percentUsed: 130 }),
      status({ id: "c", percentUsed: 85 }),
      status({ id: "d", percentUsed: 60 }),
    ];

    expect(budgetsNeedingAttention(statuses).map((s) => s.id)).toEqual([
      "b",
      "c",
      "d",
    ]);
  });

  it("excludes the overall budget, which would crowd out real categories", () => {
    const statuses = [
      status({ id: "overall", categoryId: null, percentUsed: 99 }),
      status({ id: "a", percentUsed: 10 }),
    ];

    expect(budgetsNeedingAttention(statuses).map((s) => s.id)).toEqual(["a"]);
  });

  it("falls back to the overall budget when it is the only one", () => {
    const statuses = [status({ id: "overall", categoryId: null, percentUsed: 40 })];

    expect(budgetsNeedingAttention(statuses).map((s) => s.id)).toEqual(["overall"]);
  });

  it("returns nothing when there are no budgets", () => {
    expect(budgetsNeedingAttention([])).toEqual([]);
  });
});

describe("shiftMonth", () => {
  it("moves within a year", () => {
    expect(shiftMonth("2026-07", -1)).toBe("2026-06");
    expect(shiftMonth("2026-07", 1)).toBe("2026-08");
  });

  it("rolls over year boundaries in both directions", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  it("keeps the yyyy-MM zero padding the API requires", () => {
    expect(shiftMonth("2026-10", -1)).toBe("2026-09");
  });
});

describe("formatMonth", () => {
  it("renders a readable month and year", () => {
    // Locale-dependent wording, so assert on the parts that must survive.
    expect(formatMonth("2026-07")).toContain("2026");
    expect(formatMonth("2026-07")).not.toBe("2026-07");
  });

  it("passes malformed input through untouched", () => {
    expect(formatMonth("nonsense")).toBe("nonsense");
  });
});
