import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import ExpenseFormModal from "@/Components/Forms/ExpenseForm";
import * as accountHooks from "@/Hooks/queries/useAccounts";
import * as categoryHooks from "@/Hooks/queries/useCategories";
import { CategoryType } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { Category } from "@/Models/Category";
import type { Expense } from "@/Models/Expense";

// The desktop create/edit dialog. These tests are about the split-bill block
// being first-class here too: it round-trips an existing receivable and leaves
// an ordinary expense untouched.

vi.mock("@/Hooks/queries/useAccounts");
vi.mock("@/Hooks/queries/useCategories");

const accounts: Account[] = [
  {
    id: "acc-cash",
    name: "Cash",
    amountType: 0,
    balance: 100,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
];

const categories: Category[] = [
  {
    id: "cat-food",
    name: "Food",
    categoryType: CategoryType.Expense,
    color: "#c96442",
    description: "",
  } as Category,
];

const onSubmit = vi.fn();

function mockQueries() {
  vi.mocked(accountHooks).useAccountsQuery.mockReturnValue({
    data: accounts,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof accountHooks.useAccountsQuery>);

  vi.mocked(categoryHooks).useCategoriesQuery.mockReturnValue({
    data: categories,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof categoryHooks.useCategoriesQuery>);
}

const plainRow: Expense = {
  id: "e1",
  title: "Groceries",
  amount: 40,
  date: "2026-07-10",
  description: "",
  accountId: "acc-cash",
  categoryId: "cat-food",
};

const splitRow: Expense = {
  id: "e2",
  title: "Dinner",
  amount: 60,
  date: "2026-07-12",
  description: "",
  accountId: "acc-cash",
  categoryId: "cat-food",
  expectedReimbursement: 40,
  settledReimbursement: 0,
  openReimbursement: 40,
};

function renderForm(row?: Expense | null) {
  return render(
    <MemoryRouter>
      <ExpenseFormModal
        row={row}
        onSubmit={onSubmit}
        open
        onOpenChange={() => {}}
      />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockQueries();
});

describe("ExpenseFormModal split bill", () => {
  it("opens collapsed for an expense nobody owes anything on", () => {
    renderForm(plainRow);

    expect(screen.getByRole("button", { name: "Split bill" })).toBeVisible();
    expect(screen.queryByLabelText("Your share")).toBeNull();
  });

  it("round-trips an existing split: the stored receivable becomes my share", async () => {
    const user = userEvent.setup();
    renderForm(splitRow);

    // 60 total, 40 owed to me → my share was 20.
    const share = screen.getByLabelText("Your share");
    expect(share).toHaveValue("20");
    expect(screen.getByText(/Owed to you/)).toHaveTextContent("€40.00");

    await user.click(screen.getByRole("button", { name: "Update Expense" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      amount: 60,
      expectedReimbursement: 40,
    });
  });

  it("re-derives the receivable when the total is corrected", async () => {
    const user = userEvent.setup();
    renderForm(splitRow);

    // The share is the stable intent; the total is what gets retyped.
    const amount = screen.getByLabelText("Amount");
    await user.clear(amount);
    await user.type(amount, "50");

    expect(screen.getByLabelText("Your share")).toHaveValue("20");
    expect(screen.getByText(/Owed to you/)).toHaveTextContent("€30.00");

    await user.click(screen.getByRole("button", { name: "Update Expense" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      amount: 50,
      expectedReimbursement: 30,
    });
  });

  it("clears the receivable when the split is taken back", async () => {
    const user = userEvent.setup();
    renderForm(splitRow);

    await user.click(screen.getByRole("button", { name: "Not a split" }));

    expect(screen.queryByLabelText("Your share")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Update Expense" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].expectedReimbursement).toBeNull();
  });

  // Regression pin: editing an ordinary expense must not invent a receivable.
  it("leaves a plain expense without a positive receivable", async () => {
    const user = userEvent.setup();
    renderForm(plainRow);

    await user.click(screen.getByRole("button", { name: "Update Expense" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.amount).toBe(40);
    expect(payload.expectedReimbursement ?? null).toBeNull();
  });

  it("splits a brand new expense from the dialog", async () => {
    const user = userEvent.setup();
    renderForm(null);

    await user.type(screen.getByLabelText("Amount"), "60");
    await user.click(screen.getByRole("button", { name: "Split bill" }));
    await user.type(screen.getByLabelText("Your share"), "20");
    await user.click(screen.getByRole("radio", { name: /Food/ }));
    await user.click(screen.getByRole("radio", { name: /Cash/ }));
    await user.click(screen.getByRole("button", { name: "Add Expense" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      amount: 60,
      expectedReimbursement: 40,
    });
  });
});
