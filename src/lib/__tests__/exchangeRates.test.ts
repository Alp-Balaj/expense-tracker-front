import { describe, expect, it } from "vitest";
import {
  buildRateMap,
  convertToBase,
  formatRateAge,
  rateFreshness,
  STALE_AFTER_DAYS,
} from "@/lib/exchangeRates";
import type { Currency } from "@/Models/Currency";

function currency(overrides: Partial<Currency> = {}): Currency {
  return {
    id: overrides.code ?? "1",
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    exchangeRateToBase: 0.87804,
    rateUpdatedAtUtc: null,
    ...overrides,
  };
}

const NOW = new Date("2026-07-27T12:00:00Z");
const daysAgo = (n: number) =>
  new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

describe("convertToBase", () => {
  // The bug this whole module exists to prevent: the UI used to divide by the
  // rate, inverting every converted figure on the dashboard.
  const rates = buildRateMap([
    currency({ code: "USD", exchangeRateToBase: 0.87804 }),
    currency({ code: "GBP", exchangeRateToBase: 1.169262 }),
    currency({ code: "EUR", exchangeRateToBase: 1 }),
  ]);

  it("multiplies by the rate, matching the backend's amountInBase = amount * rate", () => {
    // 100 USD at the ECB's 2026-07-27 rate is 87.80 EUR, not the 113.89 that
    // dividing would produce.
    expect(convertToBase(100, "USD", "EUR", rates)).toBeCloseTo(87.804, 3);
  });

  it("converts a currency stronger than the base upwards", () => {
    expect(convertToBase(100, "GBP", "EUR", rates)).toBeCloseTo(116.9262, 3);
  });

  it("leaves an amount already in the base currency alone", () => {
    expect(convertToBase(100, "EUR", "EUR", rates)).toBe(100);
  });

  it("converts even when the base currency has no row of its own", () => {
    // The old implementation looked up the base currency and bailed out without
    // it, silently skipping conversion for anyone who hadn't created that row.
    const withoutBase = buildRateMap([currency({ code: "USD", exchangeRateToBase: 0.87804 })]);
    expect(convertToBase(100, "USD", "EUR", withoutBase)).toBeCloseTo(87.804, 3);
  });

  it("compares currency codes case-insensitively", () => {
    expect(convertToBase(100, "usd", "eur", rates)).toBeCloseTo(87.804, 3);
  });

  it("falls back to the raw amount when there is no usable rate", () => {
    // Showing the unconverted number is honest; inventing a rate is not.
    expect(convertToBase(100, "JPY", "EUR", rates)).toBe(100);
    expect(convertToBase(100, "", "EUR", rates)).toBe(100);
    const zeroRate = buildRateMap([currency({ code: "XXX", exchangeRateToBase: 0 })]);
    expect(convertToBase(100, "XXX", "EUR", zeroRate)).toBe(100);
  });
});

describe("rateFreshness", () => {
  it("reports the age of the oldest rate that actually needs one", () => {
    const result = rateFreshness(
      [
        currency({ code: "USD", rateUpdatedAtUtc: daysAgo(1) }),
        currency({ code: "GBP", rateUpdatedAtUtc: daysAgo(4) }),
      ],
      "EUR",
      NOW,
    );

    expect(result.ageInDays).toBe(4);
    expect(result.isStale).toBe(true);
    expect(result.hasUnknownAge).toBe(false);
  });

  it("ignores the base currency, whose rate is 1 by definition and never stale", () => {
    // Including a freshly stamped base row would peg the age at 0 and hide the
    // genuinely stale USD rate behind it.
    const result = rateFreshness(
      [
        currency({ code: "EUR", exchangeRateToBase: 1, rateUpdatedAtUtc: daysAgo(0) }),
        currency({ code: "USD", rateUpdatedAtUtc: daysAgo(5) }),
      ],
      "EUR",
      NOW,
    );

    expect(result.ageInDays).toBe(5);
    expect(result.isStale).toBe(true);
  });

  it("treats a never-stamped rate as unknown rather than old", () => {
    const result = rateFreshness([currency({ code: "USD", rateUpdatedAtUtc: null })], "EUR", NOW);

    expect(result.ageInDays).toBeNull();
    expect(result.hasUnknownAge).toBe(true);
    expect(result.isStale).toBe(false);
  });

  it("stays quiet for rates fetched inside the stale window", () => {
    const result = rateFreshness(
      [currency({ code: "USD", rateUpdatedAtUtc: daysAgo(STALE_AFTER_DAYS - 1) })],
      "EUR",
      NOW,
    );

    expect(result.isStale).toBe(false);
  });

  it("has nothing to report when the only currency is the base one", () => {
    const result = rateFreshness([currency({ code: "EUR", exchangeRateToBase: 1 })], "EUR", NOW);

    expect(result.ageInDays).toBeNull();
    expect(result.hasUnknownAge).toBe(false);
  });
});

describe("formatRateAge", () => {
  const age = (days: number | null, unknown = false) =>
    formatRateAge({
      oldestUpdatedAt: null,
      ageInDays: days,
      hasUnknownAge: unknown,
      isStale: days !== null && days >= STALE_AFTER_DAYS,
    });

  it("phrases the hint the way the suggestion asks for", () => {
    expect(age(3)).toBe("Rates from 3 days ago");
    expect(age(1)).toBe("Rates from yesterday");
    expect(age(0)).toBe("Rates updated today");
  });

  it("says nothing when there is nothing to say", () => {
    expect(age(null)).toBeNull();
  });

  it("distinguishes never-updated from stale", () => {
    expect(age(null, true)).toBe("Exchange rates have never been updated");
  });
});
