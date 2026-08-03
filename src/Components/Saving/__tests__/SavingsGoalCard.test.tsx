import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { SavingsGoalCard } from "@/Components/Saving/SavingsGoalCard";
import * as accountHooks from "@/Hooks/queries/useAccounts";
import { AmountType } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { SavingContributions, SavingGoals } from "@/Models/SavingGoals";

// The card is where a virtual goal gets a physical address: it has to say
// which accounts are holding its money, admit when a release took money back
// out, and warn when an account no longer has what the goal reserved on it.

vi.mock("@/Hooks/queries/useAccounts");

// The code travels with the amount so the currency the card chose is visible
// to assertions — a goal's own currency, not the user's base, is the point.
vi.mock("@/Hooks/useCurrency", () => ({
  useCurrency: () => ({
    userCurrencyCode: "EUR",
    currenciesMap: {},
    convert: (amount: number) => amount,
    format: (amount: number, code: string) => `${code} ${amount.toFixed(2)}`,
    formatOriginal: (amount: number, code: string) => `${code} ${amount.toFixed(2)}`,
  }),
}));

function account(overrides: Partial<Account>): Account {
  return {
    id: "acc-savings",
    name: "Rainy Day",
    amountType: AmountType.SavingsAccount,
    balance: 1000,
    reservedAmount: 300,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
    ...overrides,
  };
}

function contribution(overrides: Partial<SavingContributions>): SavingContributions {
  return {
    id: "c",
    goalId: "goal-1",
    amount: 100,
    date: "2026-06-01",
    note: "",
    accountId: "acc-savings",
    ...overrides,
  };
}

function goal(overrides: Partial<SavingGoals> = {}): SavingGoals {
  return {
    id: "goal-1",
    title: "Emergency fund",
    targetAmount: 5000,
    savedAmount: 450,
    deadline: "2027-01-01",
    description: "",
    accountId: null,
    categoryId: "cat-1",
    currencyCode: "EUR",
    contributions: [],
    ...overrides,
  };
}

const accounts: Account[] = [
  account({ id: "acc-savings", name: "Rainy Day" }),
  account({
    id: "acc-checking",
    name: "Main Checking",
    amountType: AmountType.CheckingAccount,
    balance: 2000,
    reservedAmount: 150,
  }),
];

/** The "Rainy Day €300" chunk of the per-account breakdown line. */
const breakdownFor = (name: string) =>
  screen.getByText(name).parentElement?.textContent ?? "";

function renderCard(row: SavingGoals, available: Account[] = accounts) {
  vi.mocked(accountHooks).useAccountsQuery.mockReturnValue({
    data: available,
    isLoading: false,
  } as never);

  render(
    <MemoryRouter>
      <SavingsGoalCard
        goal={row}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onAddContribution={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe("SavingsGoalCard", () => {
  // jsdom has no matchMedia; the contribution modal's FormShell needs one.
  beforeAll(() => {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups the contributions by account and sums each", () => {
    renderCard(
      goal({
        savedAmount: 450,
        contributions: [
          contribution({ id: "c1", accountId: "acc-savings", amount: 200 }),
          contribution({ id: "c2", accountId: "acc-checking", amount: 150 }),
          contribution({ id: "c3", accountId: "acc-savings", amount: 100 }),
        ],
      }),
    );

    expect(breakdownFor("Rainy Day")).toContain("EUR 300.00");
    expect(breakdownFor("Main Checking")).toContain("EUR 150.00");
  });

  it("nets a release out of the account it was released from", () => {
    renderCard(
      goal({
        savedAmount: 150,
        contributions: [
          contribution({ id: "c1", accountId: "acc-savings", amount: 200 }),
          contribution({ id: "c2", accountId: "acc-savings", amount: -50 }),
        ],
      }),
    );

    expect(breakdownFor("Rainy Day")).toContain("EUR 150.00");
  });

  it("reads a negative contribution as a release, never as '+ -50'", () => {
    renderCard(
      goal({
        contributions: [contribution({ id: "c1", amount: -50 })],
      }),
    );

    expect(screen.getByText("− EUR 50.00")).toBeInTheDocument();
    expect(screen.queryByText(/\+ EUR -50/)).not.toBeInTheDocument();
  });

  it("warns when an account holds less than savings goals reserved on it", () => {
    renderCard(
      goal({
        contributions: [contribution({ id: "c1", accountId: "acc-savings" })],
      }),
      [account({ id: "acc-savings", name: "Rainy Day", balance: 50, reservedAmount: 300 })],
    );

    expect(screen.getByText(/Rainy Day holds less than/i)).toBeInTheDocument();
  });

  it("stays quiet when every account still covers what it reserved", () => {
    renderCard(
      goal({
        contributions: [contribution({ id: "c1", accountId: "acc-savings" })],
      }),
    );

    expect(screen.queryByText(/holds less than/i)).not.toBeInTheDocument();
  });

  it("formats the goal's figures in the goal's own currency", () => {
    renderCard(goal({ currencyCode: "USD", savedAmount: 450, targetAmount: 5000 }));

    expect(screen.getByText("USD 450.00")).toBeInTheDocument();
    expect(screen.getByText(/of your USD 5000.00 goal/)).toBeInTheDocument();
  });

  it("falls back to the user's currency while the goal is empty", () => {
    renderCard(goal({ currencyCode: null, savedAmount: 0 }));

    expect(screen.getByText("EUR 0.00")).toBeInTheDocument();
  });
});
