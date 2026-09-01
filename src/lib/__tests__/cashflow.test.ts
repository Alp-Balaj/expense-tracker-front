import { describe, expect, it } from "vitest";
import { firstBelowZero, lowestPoint, plannedRemainingThisMonth } from "@/lib/cashflow";
import type { CashflowPoint, CashflowProjection } from "@/Models/Cashflow";

function point(date: string, projectedBalance: number): CashflowPoint {
  return { date, projectedBalance, plannedOutflow: 0, plannedInflow: 0 };
}

describe("lowestPoint", () => {
  it("is null with no points", () => {
    expect(lowestPoint([])).toBeNull();
  });

  it("finds where the month pinches", () => {
    const low = lowestPoint([
      point("2026-07-27", 900),
      point("2026-07-28", 450),
      point("2026-07-29", 700),
    ]);
    expect(low?.date).toBe("2026-07-28");
    expect(low?.projectedBalance).toBe(450);
  });

  it("keeps the earlier day on a tie — the one the user reaches first", () => {
    const low = lowestPoint([
      point("2026-07-27", 500),
      point("2026-07-28", 450),
      point("2026-07-29", 450),
    ]);
    expect(low?.date).toBe("2026-07-28");
  });
});

describe("firstBelowZero", () => {
  it("names the crossing, not the bottom of the slide", () => {
    const crossing = firstBelowZero([
      point("2026-07-27", 100),
      point("2026-07-28", -20),
      point("2026-07-29", -400),
    ]);
    expect(crossing?.date).toBe("2026-07-28");
  });

  it("is null while the projection stays above water", () => {
    expect(firstBelowZero([point("2026-07-27", 100)])).toBeNull();
  });
});

describe("plannedRemainingThisMonth", () => {
  function projection(overrides: Partial<CashflowProjection> = {}): CashflowProjection {
    return {
      month: "2026-07",
      baseCurrency: "EUR",
      hasMissingRates: false,
      today: "2026-07-20",
      endOfMonth: "2026-07-31",
      startingBalance: 1_000,
      dailyBurnRate: 10,
      projectedEndOfMonthBalance: 500,
      projectedEndBalance: 300,
      points: [],
      ...overrides,
    };
  }

  function outflow(date: string, plannedOutflow: number): CashflowPoint {
    return { date, projectedBalance: 0, plannedOutflow, plannedInflow: 0 };
  }

  it("sums the planned outflow left in the month", () => {
    const remaining = plannedRemainingThisMonth(
      projection({
        points: [outflow("2026-07-20", 40), outflow("2026-07-25", 800), outflow("2026-07-31", 60)],
      }),
      "2026-07",
    );
    expect(remaining).toBe(900);
  });

  it("stops at the end of the month, not the end of the 30-day window", () => {
    // The window always runs past month end; August's rent is next month's
    // problem and must not land in this month's projection.
    const remaining = plannedRemainingThisMonth(
      projection({ points: [outflow("2026-07-31", 60), outflow("2026-08-01", 1_200)] }),
      "2026-07",
    );
    expect(remaining).toBe(60);
  });

  it("keeps today's point, which is where overdue bills are clamped to", () => {
    const remaining = plannedRemainingThisMonth(
      projection({ points: [outflow("2026-07-20", 250)] }),
      "2026-07",
    );
    expect(remaining).toBe(250);
  });

  it("is null for a month the projection does not describe", () => {
    // Stepping back to June: the projection is anchored on today and knows
    // nothing about a month that is already over.
    expect(plannedRemainingThisMonth(projection(), "2026-06")).toBeNull();
  });

  it("is null while the projection is still loading", () => {
    expect(plannedRemainingThisMonth(undefined, "2026-07")).toBeNull();
  });

  it("is zero for a user with nothing planned", () => {
    expect(plannedRemainingThisMonth(projection({ points: [outflow("2026-07-20", 0)] }), "2026-07"))
      .toBe(0);
  });
});
