import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import SavingContributionsModal from "@/Components/Saving/SavingContributionsModal";
import * as accountHooks from "@/Hooks/queries/useAccounts";
import { AmountType } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { SavingGoals } from "@/Models/SavingGoals";

// Savings goals are virtual, but the money behind them is not: every
// contribution has to name the account it is reserved against, and the goal's
// own currency decides which accounts are even allowed to fund it. The form's
// job is to never offer a combination the API would reject, and to make
// taking money back out as ordinary as putting it in.

vi.mock("@/Hooks/queries/useAccounts");

const accounts: Account[] = [
  {
    id: "acc-savings",
    name: "Rainy Day",
    amountType: AmountType.SavingsAccount,
    balance: 1000,
    reservedAmount: 300,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
  {
    id: "acc-checking",
    name: "Main Checking",
    amountType: AmountType.CheckingAccount,
    balance: 2000,
    reservedAmount: 0,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
  {
    id: "acc-dollars",
    name: "Dollar Account",
    amountType: AmountType.CheckingAccount,
    balance: 500,
    reservedAmount: 0,
    currencyId: "usd",
    currencyCode: "USD",
    description: "",
  },
];

function goal(overrides: Partial<SavingGoals> = {}): SavingGoals {
  return {
    id: "goal-1",
    title: "Emergency fund",
    targetAmount: 5000,
    savedAmount: 300,
    deadline: "2027-01-01",
    description: "",
    accountId: null,
    categoryId: "cat-1",
    currencyCode: null,
    contributions: [],
    ...overrides,
  };
}

function renderModal(row: SavingGoals, available: Account[] = accounts) {
  vi.mocked(accountHooks).useAccountsQuery.mockReturnValue({
    data: available,
    isLoading: false,
  } as never);

  const onSubmit = vi.fn();
  render(
    <MemoryRouter>
      <SavingContributionsModal
        goal={row}
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />
    </MemoryRouter>,
  );
  return onSubmit;
}

const accountNames = (label: string) =>
  within(screen.getByRole("radiogroup", { name: label }))
    .getAllByRole("radio")
    .map((chip) => chip.textContent);

async function typeAmount(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  value: string,
) {
  const amount = screen.getByLabelText(label);
  await user.clear(amount);
  await user.type(amount, value);
}

describe("SavingContributionsModal", () => {
  // jsdom has no matchMedia; FormShell's useIsMobile needs one to pick a variant.
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

  it("sends the chosen account with the contribution", async () => {
    const user = userEvent.setup();
    const onSubmit = renderModal(goal());

    const picker = screen.getByRole("radiogroup", { name: "Reserve against" });
    await user.click(within(picker).getByRole("radio", { name: "Main Checking" }));
    await typeAmount(user, "Amount", "150");

    await user.click(screen.getByRole("button", { name: "Add Contribution" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      goalId: "goal-1",
      amount: 150,
      accountId: "acc-checking",
    });
  });

  it("offers only accounts in the goal's currency once it holds money", () => {
    renderModal(goal({ currencyCode: "USD" }));

    expect(accountNames("Reserve against")).toEqual(["Dollar Account"]);
  });

  it("offers every account while the goal is still empty", () => {
    renderModal(goal({ currencyCode: null }));

    expect(accountNames("Reserve against")).toEqual([
      "Rainy Day",
      "Main Checking",
      "Dollar Account",
    ]);
  });

  it("preselects the account the goal was created against", () => {
    renderModal(goal({ accountId: "acc-checking" }));
    expect(
      within(screen.getByRole("radiogroup", { name: "Reserve against" })).getByRole(
        "radio",
        { name: "Main Checking" },
      ),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("falls back to the newest contribution's account when the goal names none", () => {
    renderModal(
      goal({
        contributions: [
          {
            id: "c1",
            goalId: "goal-1",
            amount: 100,
            date: "2026-05-01",
            note: "",
            accountId: "acc-savings",
          },
          {
            id: "c2",
            goalId: "goal-1",
            amount: 200,
            date: "2026-06-01",
            note: "",
            accountId: "acc-checking",
          },
        ],
      }),
    );

    expect(
      within(screen.getByRole("radiogroup", { name: "Reserve against" })).getByRole(
        "radio",
        { name: "Main Checking" },
      ),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("negates the amount when releasing money", async () => {
    const user = userEvent.setup();
    const onSubmit = renderModal(goal({ accountId: "acc-savings" }));

    const direction = screen.getByRole("radiogroup", { name: "Direction" });
    await user.click(within(direction).getByRole("radio", { name: "Release" }));

    // The typed amount stays positive; only the wire value is signed.
    await typeAmount(user, "Release", "50");
    await user.click(screen.getByRole("button", { name: "Release Money" }));

    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      amount: -50,
      accountId: "acc-savings",
    });
  });

  it("keeps a zero amount unsubmittable in either direction", async () => {
    const user = userEvent.setup();
    renderModal(goal({ accountId: "acc-savings" }));

    expect(screen.getByRole("button", { name: "Add Contribution" })).toBeDisabled();

    const direction = screen.getByRole("radiogroup", { name: "Direction" });
    await user.click(within(direction).getByRole("radio", { name: "Release" }));
    expect(screen.getByRole("button", { name: "Release Money" })).toBeDisabled();
  });

  it("says so plainly instead of rendering a form when there are no accounts", () => {
    renderModal(goal(), []);

    expect(screen.getByText(/don't have one yet/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("radiogroup", { name: "Reserve against" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Contribution" })).toBeDisabled();
  });

  it("explains the dead end when no account matches the goal's currency", () => {
    renderModal(goal({ currencyCode: "GBP" }));

    expect(screen.getByText(/This goal holds GBP/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Contribution" })).toBeDisabled();
  });
});
