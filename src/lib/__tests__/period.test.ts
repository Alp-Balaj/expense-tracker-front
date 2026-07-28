import { describe, expect, it } from "vitest";

import {
  MAX_DATE,
  MIN_DATE,
  filterByPeriod,
  isWithinPeriod,
  monthEnd,
  monthSpan,
  monthStart,
  periodLabel,
  precedingPeriod,
  resolvePeriod,
  trendMonths,
} from "@/lib/period";

// Everything here takes `today` explicitly, so these run the same in any
// timezone and on any day. 2026-07-15 is a Wednesday in a 31-day month.
const TODAY = "2026-07-15";

describe("resolvePeriod", () => {
  it("covers the whole current month, not just up to today", () => {
    expect(resolvePeriod("thisMonth", TODAY)).toEqual({
      preset: "thisMonth",
      from: "2026-07-01",
      to: "2026-07-31",
    });
  });

  it("steps back a whole month for lastMonth", () => {
    expect(resolvePeriod("lastMonth", TODAY)).toEqual({
      preset: "lastMonth",
      from: "2026-06-01",
      to: "2026-06-30",
    });
  });

  it("counts the current month as one of the last 3", () => {
    expect(resolvePeriod("last3Months", TODAY)).toEqual({
      preset: "last3Months",
      from: "2026-05-01",
      to: "2026-07-31",
    });
  });

  it("spans the calendar year", () => {
    expect(resolvePeriod("thisYear", TODAY)).toEqual({
      preset: "thisYear",
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });

  it("uses sentinels wide enough to hold any transaction for all time", () => {
    expect(resolvePeriod("all", TODAY)).toEqual({
      preset: "all",
      from: MIN_DATE,
      to: MAX_DATE,
    });
  });

  it("crosses the year boundary when stepping back from January", () => {
    expect(resolvePeriod("lastMonth", "2026-01-09")).toEqual({
      preset: "lastMonth",
      from: "2025-12-01",
      to: "2025-12-31",
    });
  });

  it("lands on the right last day in February", () => {
    expect(resolvePeriod("thisMonth", "2026-02-10").to).toBe("2026-02-28");
    // 2024 was a leap year.
    expect(resolvePeriod("thisMonth", "2024-02-10").to).toBe("2024-02-29");
  });

  describe("custom", () => {
    it("keeps the range it is given", () => {
      const period = resolvePeriod("custom", TODAY, {
        from: "2026-03-04",
        to: "2026-05-06",
      });
      expect(period).toEqual({ preset: "custom", from: "2026-03-04", to: "2026-05-06" });
    });

    it("swaps a reversed range rather than selecting nothing", () => {
      const period = resolvePeriod("custom", TODAY, {
        from: "2026-05-06",
        to: "2026-03-04",
      });
      expect(period.from).toBe("2026-03-04");
      expect(period.to).toBe("2026-05-06");
    });

    it("degrades to the current month when the range is missing", () => {
      expect(resolvePeriod("custom", TODAY).from).toBe("2026-07-01");
    });
  });
});

describe("isWithinPeriod", () => {
  const july = resolvePeriod("thisMonth", TODAY);

  it("includes both bounds", () => {
    expect(isWithinPeriod("2026-07-01", july)).toBe(true);
    expect(isWithinPeriod("2026-07-31", july)).toBe(true);
  });

  it("excludes the days either side", () => {
    expect(isWithinPeriod("2026-06-30", july)).toBe(false);
    expect(isWithinPeriod("2026-08-01", july)).toBe(false);
  });

  it("accepts a full ISO datetime from pre-migration data", () => {
    expect(isWithinPeriod("2026-07-04T22:30:00Z", july)).toBe(true);
  });
});

describe("filterByPeriod", () => {
  const rows = [
    { date: "2026-05-30", amount: 1 },
    { date: "2026-06-15", amount: 2 },
    { date: "2026-07-15", amount: 3 },
  ];

  it("keeps only the rows inside the window", () => {
    const june = resolvePeriod("lastMonth", TODAY);
    expect(filterByPeriod(rows, june)).toEqual([{ date: "2026-06-15", amount: 2 }]);
  });

  it("returns everything for all time", () => {
    expect(filterByPeriod(rows, resolvePeriod("all", TODAY))).toHaveLength(3);
  });
});

describe("precedingPeriod", () => {
  it("compares this month against last month", () => {
    const previous = precedingPeriod(resolvePeriod("thisMonth", TODAY));
    expect(previous).toMatchObject({ from: "2026-06-01", to: "2026-06-30" });
  });

  // The point of the comparison card: "Last month" is measured against the
  // month before it, not against a fixed "previous calendar month".
  it("compares last month against the month before it", () => {
    const previous = precedingPeriod(resolvePeriod("lastMonth", TODAY));
    expect(previous).toMatchObject({ from: "2026-05-01", to: "2026-05-31" });
  });

  it("steps a 3-month window back by 3 whole months", () => {
    const previous = precedingPeriod(resolvePeriod("last3Months", TODAY));
    expect(previous).toMatchObject({ from: "2026-02-01", to: "2026-04-30" });
  });

  it("compares this year against last year", () => {
    const previous = precedingPeriod(resolvePeriod("thisYear", TODAY));
    expect(previous).toMatchObject({ from: "2025-01-01", to: "2025-12-31" });
  });

  it("steps a custom range back by its own length", () => {
    // 2026-07-10..2026-07-14 is 5 days; the window before it ends on the 9th.
    const previous = precedingPeriod(
      resolvePeriod("custom", TODAY, { from: "2026-07-10", to: "2026-07-14" }),
    );
    expect(previous).toMatchObject({ from: "2026-07-05", to: "2026-07-09" });
  });

  it("has nothing before all time", () => {
    expect(precedingPeriod(resolvePeriod("all", TODAY))).toBeNull();
  });
});

describe("trendMonths", () => {
  it("charts six months ending at the current one", () => {
    expect(trendMonths(resolvePeriod("thisMonth", TODAY), TODAY)).toEqual([
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
    ]);
  });

  // A one-month period must not collapse the trend to a single point; picking
  // "Last month" slides the window back instead.
  it("slides the window back for last month", () => {
    const months = trendMonths(resolvePeriod("lastMonth", TODAY), TODAY);
    expect(months).toHaveLength(6);
    expect(months[months.length - 1]).toBe("2026-06");
  });

  it("widens for a longer period but never past the current month", () => {
    const months = trendMonths(resolvePeriod("thisYear", TODAY), TODAY);
    expect(months).toHaveLength(12);
    expect(months[months.length - 1]).toBe("2026-07");
  });

  it("caps all time at twelve buckets", () => {
    expect(trendMonths(resolvePeriod("all", TODAY), TODAY)).toHaveLength(12);
  });
});

describe("month helpers", () => {
  it("bounds a month", () => {
    expect(monthStart("2026-07")).toBe("2026-07-01");
    expect(monthEnd("2026-07")).toBe("2026-07-31");
    expect(monthEnd("2026-11")).toBe("2026-11-30");
  });

  it("counts the months a period touches", () => {
    expect(monthSpan(resolvePeriod("thisMonth", TODAY))).toBe(1);
    expect(monthSpan(resolvePeriod("last3Months", TODAY))).toBe(3);
    expect(monthSpan(resolvePeriod("thisYear", TODAY))).toBe(12);
    expect(monthSpan(resolvePeriod("all", TODAY))).toBe(Infinity);
  });

  it("labels the period", () => {
    expect(periodLabel(resolvePeriod("lastMonth", TODAY))).toBe("Last month");
    expect(
      periodLabel(resolvePeriod("custom", TODAY, { from: "2026-01-02", to: "2026-03-04" })),
    ).toContain("2026-01-02");
  });
});
