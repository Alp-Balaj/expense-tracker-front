import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import TransferFormModal from "@/Components/Transfer/TransferFormModal";
import * as accountHooks from "@/Hooks/queries/useAccounts";
import * as savingGoalHooks from "@/Hooks/queries/useSavingGoals";
import { AmountType } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { SavingGoals } from "@/Models/SavingGoals";

// The form's job is to only ever offer combinations the API accepts: a
// destination sharing the source's currency, and a goal actually backed by
// that destination.

vi.mock("@/Hooks/queries/useAccounts");
vi.mock("@/Hooks/queries/useSavingGoals");

const accounts: Account[] = [
  {
    id: "acc-checking",
    name: "Main Checking",
    amountType: AmountType.CheckingAccount,
    balance: 2000,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
  {
    id: "acc-savings",
    name: "Rainy Day",
    amountType: AmountType.SavingsAccount,
    balance: 500,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
  {
    id: "acc-dollars",
    name: "Dollar Account",
    amountType: AmountType.CheckingAccount,
    balance: 100,
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
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByRole("option", { name: new RegExp(option) }));
}

describe("TransferFormModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers only same-currency accounts as the destination", async () => {
    const user = userEvent.setup();
    renderForm();

    await pickAccount(user, "From", "Main Checking");
    await user.click(screen.getByLabelText("To"));

    const options = await screen.findAllByRole("option");
    const names = options.map((o) => o.textContent);

    expect(names.some((n) => n?.includes("Rainy Day"))).toBe(true);
    // Different currency, and the source itself, are both unusable.
    expect(names.some((n) => n?.includes("Dollar Account"))).toBe(false);
    expect(names.some((n) => n?.includes("Main Checking"))).toBe(false);
  });

  it("offers the savings-goal link only once the destination backs a goal", async () => {
    const user = userEvent.setup();
    renderForm();

    await pickAccount(user, "From", "Rainy Day");
    expect(screen.queryByText(/count this toward a savings goal/i)).not.toBeInTheDocument();

    await pickAccount(user, "To", "Main Checking");
    // Main Checking backs no goal.
    expect(screen.queryByText(/count this toward a savings goal/i)).not.toBeInTheDocument();
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

  it("drops a chosen goal when the destination moves away from it", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await pickAccount(user, "From", "Main Checking");
    await pickAccount(user, "To", "Rainy Day");
    await user.click(screen.getByLabelText(/count this toward a savings goal/i));

    // Repointing at an account with no goal must clear the stale link.
    await pickAccount(user, "From", "Rainy Day");
    await pickAccount(user, "To", "Main Checking");

    const amount = screen.getByLabelText("Amount");
    await user.clear(amount);
    await user.type(amount, "50");

    await user.click(screen.getByRole("button", { name: "Transfer" }));

    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      fromAccountId: "acc-savings",
      toAccountId: "acc-checking",
      savingGoalId: null,
    });
  });

  it("keeps a transfer with no accounts picked unsubmittable", () => {
    renderForm();

    expect(screen.getByRole("button", { name: "Transfer" })).toBeDisabled();
  });
});
