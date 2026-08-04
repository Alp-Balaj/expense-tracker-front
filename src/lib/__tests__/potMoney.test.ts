import { describe, expect, it } from "vitest";

import { allocateEven, allocateShares, formatPosition, formatPotAmount, toCents } from "@/lib/potMoney";

/**
 * The client half of the split arithmetic.
 *
 * The server is authoritative and re-allocates everything it is sent, so these
 * numbers are a preview. They are not, however, allowed to be a *different*
 * preview: the picker shows each person's slice while you type, and a figure
 * that changed when you pressed save would undermine the one thing the screen
 * is for. So this mirrors `ShareAllocator` case for case, including the
 * sentences, and the backend suite pins the same examples.
 */
describe("allocateEven", () => {
  it("splits ten across three as 3.34 / 3.33 / 3.33", () => {
    expect(allocateEven(1000, 3)).toEqual([334, 333, 333]);
  });

  it("gives the leftover cent to the earliest slot", () => {
    // Which the caller has arranged to be the earliest-joined member — the
    // tie-break is join order, and this function only knows about position.
    expect(allocateEven(1001, 4)).toEqual([251, 250, 250, 250]);
  });

  it.each([
    [0, 1],
    [1, 4],
    [999_999, 7],
    [99, 100],
  ])("always adds back up (%i cents across %i)", (total, count) => {
    const shares = allocateEven(total, count);
    expect(shares).toHaveLength(count);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(total);
    expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
  });
});

describe("allocateShares", () => {
  it("divides the whole amount when nothing is pinned", () => {
    expect(allocateShares(1000, [null, null, null])).toEqual({
      shares: [334, 333, 333],
      error: null,
    });
  });

  it("divides only the remainder when something is pinned", () => {
    expect(allocateShares(1000, [250, null, null])).toEqual({
      shares: [250, 375, 375],
      error: null,
    });
  });

  it("keeps adding up when the remainder does not divide cleanly", () => {
    const { shares } = allocateShares(1000, [1, null, null]);
    expect(shares).toEqual([1, 500, 499]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(1000);
  });

  it("refuses pinned amounts over the total, in the server's words", () => {
    expect(allocateShares(1000, [800, 700, null]).error).toBe(
      "Those shares add up to more than the expense.",
    );
  });

  it("refuses an all-pinned split that does not add up, rather than stretching one", () => {
    expect(allocateShares(1000, [400, 350, 200]).error).toBe(
      "Those shares have to add up to the expense.",
    );
  });

  it("takes an all-pinned split that does add up exactly as typed", () => {
    expect(allocateShares(1000, [400, 350, 250]).shares).toEqual([400, 350, 250]);
  });

  it("refuses an expense for nobody", () => {
    expect(allocateShares(1000, []).error).toBe("Say who this expense was for.");
  });
});

describe("formatting", () => {
  it("always shows the cents, because the parts have to be checkable by eye", () => {
    expect(formatPotAmount(120, "EUR")).toBe("€120.00");
    expect(formatPotAmount(3.5, "EUR")).toBe("€3.50");
  });

  it("uses a real minus sign for a negative figure", () => {
    expect(formatPotAmount(-30, "EUR")).toBe("−€30.00");
  });

  it("signs a position both ways, because the sign is the whole message", () => {
    expect(formatPosition(40, "EUR")).toBe("+€40.00");
    expect(formatPosition(-15, "EUR")).toBe("−€15.00");
    expect(formatPosition(0, "EUR")).toBe("€0.00");
  });

  it("rounds to the cent the way the server does", () => {
    expect(toCents(10.005)).toBe(1001);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
});
