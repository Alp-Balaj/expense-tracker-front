import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { SafeToSpend, type SafeToSpendProps } from "@/Components/Dashboard/SafeToSpend";

// The month's forward half. "62% used" reads as comfortable right up until you
// see that the bills already agreed to take it to 94%, so the card has to show
// what is committed as well as what is gone. What matters here: it must never
// appear for a month that cannot have a remainder (a past month, or a
// projection still loading), it must not restate the obvious for a user with
// nothing planned, and when a budget exists the sentence and the bar must be
// derived from the same "already spent" figure so they cannot disagree.

vi.mock("@/Hooks/useCurrency", () => ({
  useCurrency: () => ({
    userCurrencyCode: "EUR",
    currenciesMap: {},
    convert: (amount: number) => amount,
    format: (amount: number) => `€${amount.toFixed(2)}`,
    formatOriginal: (amount: number) => `€${amount.toFixed(2)}`,
  }),
}));

function renderCard(overrides: Partial<SafeToSpendProps> = {}) {
  const props: SafeToSpendProps = {
    monthLabel: "July",
    daysLeft: 11,
    elapsed: 0.65,
    budget: { limit: 1_000, spent: 620, remaining: 380, percentUsed: 62 },
    spentThisMonth: 620,
    plannedRemaining: 320,
    netThisMonth: 400,
    liquid: { total: 2_000, reserved: 0, liquidCount: 2, accountCount: 3 },
    runwayDays: 40,
    isLoading: false,
    onSetBudget: vi.fn(),
    ...overrides,
  };
  return render(<SafeToSpend {...props} />);
}

describe("SafeToSpend — projected month spend", () => {
  it("adds what is still planned to what is already spent", () => {
    renderCard();
    // 620 spent + 320 committed.
    expect(screen.getByTestId("projected-spend")).toHaveTextContent("€940.00");
    expect(screen.getByTestId("projected-spend")).toHaveTextContent("€320.00 still planned");
  });

  it("counts the budget's own spent figure, not the page's, when a budget exists", () => {
    // The two are netted differently in edge cases; taking the budget's keeps
    // the sentence and the bar underneath it telling one story.
    renderCard({ budget: { limit: 1_000, spent: 500, remaining: 500, percentUsed: 50 }, spentThisMonth: 620 });
    expect(screen.getByTestId("projected-spend")).toHaveTextContent("€820.00");
  });

  it("says nothing for a user with nothing planned", () => {
    renderCard({ plannedRemaining: 0 });
    expect(screen.queryByTestId("projected-spend")).toBeNull();
  });

  it("says nothing for a past month, which has no remainder", () => {
    renderCard({ plannedRemaining: null });
    expect(screen.queryByTestId("projected-spend")).toBeNull();
  });

  it("still shows the projection when no budget is set", () => {
    renderCard({ budget: null });
    expect(screen.getByTestId("projected-spend")).toHaveTextContent("€940.00");
    expect(screen.getByRole("button", { name: /set a budget/i })).toBeInTheDocument();
  });

  it("flags a projection that runs past the budget, while the bar itself has not", () => {
    // 620 of 1000 spent is comfortable; 620 + 500 committed is not, and the
    // card has to say so before the money goes.
    renderCard({ plannedRemaining: 500 });
    const projected = screen.getByTestId("projected-spend");
    expect(projected).toHaveTextContent("€1120.00");
    expect(projected.querySelector("strong")).toHaveClass("text-destructive");
  });

  it("shows nothing while the projection is still loading", () => {
    renderCard({ isLoading: true });
    expect(screen.queryByTestId("projected-spend")).toBeNull();
  });
});
