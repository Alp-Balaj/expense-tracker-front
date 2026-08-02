import { describe, expect, it } from "vitest";
import { firstBelowZero, lowestPoint } from "@/lib/cashflow";
import type { CashflowPoint } from "@/Models/Cashflow";

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
