import { describe, expect, it } from "vitest";
import { buildInsightSentences } from "@/lib/insights";
import type { CategoryInsight, Insights } from "@/Models/Insights";

const fmt = (amount: number) => `€${amount.toFixed(2)}`;

function category(overrides: Partial<CategoryInsight> = {}): CategoryInsight {
  return {
    categoryId: "cat-1",
    categoryName: "Groceries",
    categoryColor: null,
    currentMonthTotal: 100,
    previousMonthTotal: 100,
    momChangeAmount: 0,
    momChangePct: 0,
    trailingAverage: 100,
    vsAveragePct: 0,
    ...overrides,
  };
}

function insights(overrides: Partial<Insights> = {}): Insights {
  return {
    month: "2026-07",
    baseCurrency: "EUR",
    hasMissingRates: false,
    monthsWithHistory: 3,
    currentMonthTotal: 100,
    previousMonthTotal: 100,
    trailingAverage: 100,
    overallVsAveragePct: 0,
    categories: [],
    ...overrides,
  };
}

describe("buildInsightSentences", () => {
  it("says only that history is missing on a cold start", () => {
    const sentences = buildInsightSentences(
      insights({ monthsWithHistory: 0, trailingAverage: null, overallVsAveragePct: null }),
      fmt,
    );

    expect(sentences).toHaveLength(1);
    expect(sentences[0].text).toMatch(/Not enough history yet/);
    expect(sentences[0].tone).toBe("info");
  });

  it("leads a category that runs well above its usual", () => {
    const sentences = buildInsightSentences(
      insights({
        categories: [
          category({ categoryName: "Eating out", vsAveragePct: 40, momChangePct: 33 }),
        ],
      }),
      fmt,
    );

    const texts = sentences.map((s) => s.text);
    expect(texts).toContain("Eating out is 40% above your usual.");
  });

  it("falls back to the month-over-month move when the average is quiet", () => {
    const sentences = buildInsightSentences(
      insights({
        categories: [
          category({ categoryName: "Groceries", vsAveragePct: -3, momChangePct: -12 }),
        ],
      }),
      fmt,
    );

    const texts = sentences.map((s) => s.text);
    expect(texts).toContain("Groceries down 12% vs last month.");
    expect(sentences.find((s) => s.text.includes("Groceries"))?.tone).toBe("down");
  });

  it("calls out brand-new spending that has no baseline", () => {
    const sentences = buildInsightSentences(
      insights({
        categories: [
          category({
            categoryName: "Skiing",
            currentMonthTotal: 45,
            previousMonthTotal: 0,
            momChangePct: null,
            trailingAverage: null,
            vsAveragePct: null,
          }),
        ],
      }),
      fmt,
    );

    expect(sentences.map((s) => s.text)).toContain("New this month: €45.00 on Skiing.");
  });

  it("summarises the overall pace and stays calm when it is unremarkable", () => {
    const above = buildInsightSentences(insights({ overallVsAveragePct: 23.26 }), fmt);
    expect(above.map((s) => s.text)).toContain("Overall spending is 23% above your usual month.");

    const flat = buildInsightSentences(insights({ overallVsAveragePct: 2 }), fmt);
    expect(flat.map((s) => s.text)).toContain("Overall spending is in line with your usual month.");
  });

  it("reads at most three category sentences off the top", () => {
    const noisy = ["A", "B", "C", "D", "E"].map((name, i) =>
      category({ categoryId: `cat-${name}`, categoryName: name, vsAveragePct: 50 + i }),
    );
    const sentences = buildInsightSentences(insights({ categories: noisy }), fmt);

    const categorySentences = sentences.filter((s) => s.key.startsWith("avg:"));
    expect(categorySentences).toHaveLength(3);
    // In the backend's order — biggest movers come first in the payload.
    expect(categorySentences[0].text).toMatch(/^A /);
  });

  it("admits when the baseline is thin", () => {
    const sentences = buildInsightSentences(insights({ monthsWithHistory: 1 }), fmt);
    expect(sentences.map((s) => s.text)).toContain(
      "Based on 1 month of history — comparisons sharpen as more builds up.",
    );
  });

  it("says nothing is unusual rather than staying silent", () => {
    const sentences = buildInsightSentences(
      insights({ overallVsAveragePct: null, categories: [category()] }),
      fmt,
    );

    expect(sentences.map((s) => s.text)).toContain(
      "Nothing unusual this month — spending is tracking your history.",
    );
  });
});
