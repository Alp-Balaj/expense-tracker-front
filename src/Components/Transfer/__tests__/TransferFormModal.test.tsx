import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import TransferFormModal from "@/Components/Transfer/TransferFormModal";
import * as accountHooks from "@/Hooks/queries/useAccounts";
import * as savingGoalHooks from "@/Hooks/queries/useSavingGoals";
import { AmountType } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { SavingGoals } from "@/Models/SavingGoals";

// The form's job is to only ever offer combinations the API accepts: a
// destination sharing the source's currency, and — since Stream V — a goal
// whose currency the destination can actually hold. A goal is no longer tied
// to one account, so where it was opened no longer restricts anything.

vi.mock("@/Hooks/queries/useAccounts");
vi.mock("@/Hooks/queries/useSavingGoals");

const accounts: Account[] = [
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
    id: "acc-savings",
    name: "Rainy Day",
    amountType: AmountType.SavingsAccount,
    balance: 500,
    reservedAmount: 0,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
  {
    id: "acc-dollars",
    name: "Dollar Account",
    amountType: AmountType.CheckingAccount,
    balance: 100,
    reservedAmount: 0,
    currencyId: "usd",
    currencyCode: "USD",
    description: "",
  },
];

const goals: SavingGoals[] = [
  {
    id: "goal-rainy",
    title: "Emergency fund",
    targetAmount: 5000,
    savedAmount: 500,
    deadline: "2027-01-01",
    description: "",
    accountId: "acc-savings",
    categoryId: "cat-1",
    currencyCode: "EUR",
    contributions: [],
  },
];

function renderForm(onSubmit = vi.fn()) {
  vi.mocked(accountHooks).useAccountsQuery.mockReturnValue({
    data: accounts,
    isLoading: false,
  } as never);
  vi.mocked(savingGoalHooks).useSavingGoalsQuery.mockReturnValue({
    data: goals,
    isLoading: false,
  } as never);

  render(
    <MemoryRouter>
      <TransferFormModal open onOpenChange={vi.fn()} onSubmit={onSubmit} />
    </MemoryRouter>,
  );

  return onSubmit;
}

async function pickAccount(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  const picker = screen.getByRole("radiogroup", { name: label });
  await user.click(within(picker).getByRole("radio", { name: new RegExp(option) }));
}

describe("TransferFormModal", () => {
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

  it("offers only same-currency accounts as the destination", async () => {
    const user = userEvent.setup();
    renderForm();

    await pickAccount(user, "From", "Main Checking");

    const toPicker = screen.getByRole("radiogroup", { name: "To" });
    const names = within(toPicker)
      .getAllByRole("radio")
      .map((o) => o.textContent);

    expect(names.some((n) => n?.includes("Rainy Day"))).toBe(true);
    // Different currency, and the source itself, are both unusable.
    expect(names.some((n) => n?.includes("Dollar Account"))).toBe(false);
    expect(names.some((n) => n?.includes("Main Checking"))).toBe(false);
  });

  // Rewritten by Stream V — this used to assert the opposite second half, that
  // a destination not backing the goal could not credit it. It can now: the
  // contribution books wherever the money lands.
  it("offers the savings-goal link for any destination the goal's currency fits", async () => {
    const user = userEvent.setup();
    renderForm();

    // Nothing to credit into until a destination is chosen.
    await pickAccount(user, "From", "Rainy Day");
    expect(screen.queryByText(/count this toward a savings goal/i)).not.toBeInTheDocument();

    // Main Checking is not the account the goal was opened against, and the
    // link is offered all the same — both are euro accounts.
    await pickAccount(user, "To", "Main Checking");
    expect(screen.getByText(/count this toward a savings goal/i)).toBeInTheDocument();
  });

  it("sends the goal id when the destination's goal is credited", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await pickAccount(user, "From", "Main Checking");
    await pickAccount(user, "To", "Rainy Day");

    const checkbox = screen.getByLabelText(/count this toward a savings goal/i);
    await user.click(checkbox);

    const amount = screen.getByLabelText("Amount");
    await user.clear(amount);
    await user.type(amount, "200");

    await user.click(screen.getByRole("button", { name: "Transfer" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      amount: 200,
      fromAccountId: "acc-checking",
      toAccountId: "acc-savings",
      // The single eligible goal is picked for the user.
      savingGoalId: "goal-rainy",
    });
  });

  // Also rewritten by Stream V: moving the destination between two euro
  // accounts no longer invalidates the link, so what has to clear the goal is a
  // source change that makes the destination itself unusable.
  it("drops a chosen goal when the source change clears the destination", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await pickAccount(user, "From", "Main Checking");
    await pickAccount(user, "To", "Rainy Day");
    await user.click(screen.getByLabelText(/count this toward a savings goal/i));

    // A dollar source cannot reach the euro destination, so both it and the
    // goal riding on it go.
    await pickAccount(user, "From", "Dollar Account");
    expect(screen.queryByText(/count this toward a savings goal/i)).not.toBeInTheDocument();

    // Coming back to a workable pair must not resurrect the link the user
    // never re-ticked.
    await pickAccount(user, "From", "Main Checking");
    await pickAccount(user, "To", "Rainy Day");

    const amount = screen.getByLabelText("Amount");
    await user.clear(amount);
    await user.type(amount, "50");

    await user.click(screen.getByRole("button", { name: "Transfer" }));

    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      fromAccountId: "acc-checking",
      toAccountId: "acc-savings",
      savingGoalId: null,
    });
  });

  it("keeps a transfer with no accounts picked unsubmittable", () => {
    renderForm();

    expect(screen.getByRole("button", { name: "Transfer" })).toBeDisabled();
  });
});
