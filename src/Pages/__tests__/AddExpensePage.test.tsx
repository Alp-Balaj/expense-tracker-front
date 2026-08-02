import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import AddExpensePage from "@/Pages/AddExpensePage";
import * as accountHooks from "@/Hooks/queries/useAccounts";
import * as categoryHooks from "@/Hooks/queries/useCategories";
import * as expenseHooks from "@/Hooks/queries/useExpenses";
import { CategoryType } from "@/Enums/enums";
import { todayISO } from "@/lib/dates";
import type { Account } from "@/Models/Account";
import type { Category } from "@/Models/Category";
import type { Expense } from "@/Models/Expense";

// The /add quick-add screen: amount focused first, category chips ranked by
// recent usage, account prefilled from the last expense, optional title that
// falls back to the category, and a reset-for-the-next-entry submit.

vi.mock("@/Hooks/queries/useAccounts");
vi.mock("@/Hooks/queries/useCategories");
vi.mock("@/Hooks/queries/useExpenses");

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
  {
    id: "acc-card",
    name: "Card",
    amountType: 0,
    balance: 1000,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
];

const categories: Category[] = [
  {
    id: "cat-home",
    name: "Home",
    categoryType: CategoryType.Expense,
    color: "#8b5cf6",
    description: "",
  } as Category,
  {
    id: "cat-food",
    name: "Food",
    categoryType: CategoryType.Expense,
    color: "#c96442",
    description: "",
  } as Category,
  {
    id: "cat-salary",
    name: "Salary",
    categoryType: CategoryType.Income,
    color: "#22c55e",
    description: "",
  } as Category,
];

// Food used twice and most recently (from acc-card); Home once.
const expenses: Expense[] = [
  { id: "e1", title: "Rent", amount: 900, date: "2026-07-01", description: "", accountId: "acc-cash", categoryId: "cat-home" },
  { id: "e2", title: "Groceries", amount: 60, date: "2026-07-10", description: "", accountId: "acc-cash", categoryId: "cat-food" },
  { id: "e3", title: "Takeaway", amount: 25, date: "2026-07-20", description: "", accountId: "acc-card", categoryId: "cat-food" },
];

const mutateAsync = vi.fn();

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

  vi.mocked(expenseHooks).useExpensesQuery.mockReturnValue({
    data: expenses,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof expenseHooks.useExpensesQuery>);

  vi.mocked(expenseHooks).useCreateExpense.mockReturnValue({
    mutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof expenseHooks.useCreateExpense>);
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/add"]}>
      <Routes>
        <Route path="/add" element={<AddExpensePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function categoryChips() {
  return within(screen.getByRole("radiogroup", { name: "Category" })).getAllByRole("radio");
}

beforeEach(() => {
  vi.clearAllMocks();
  mockQueries();
  mutateAsync.mockResolvedValue({});
});

describe("AddExpensePage", () => {
  it("focuses the amount field on open", () => {
    renderPage();
    expect(screen.getByLabelText("Amount")).toHaveFocus();
  });

  it("ranks category chips by recent usage and hides income categories", () => {
    renderPage();
    const labels = categoryChips().map((chip) => chip.textContent);
    expect(labels).toEqual(["Food", "Home"]); // Food used more; Salary is income
  });

  it("preselects the most recently used account", () => {
    renderPage();
    const chips = within(
      screen.getByRole("radiogroup", { name: "Account" }),
    ).getAllByRole("radio");
    const card = chips.find((c) => c.textContent === "Card");
    expect(card).toHaveAttribute("aria-checked", "true");
  });

  it("defaults the date to today", () => {
    renderPage();
    const dateGroup = screen.getByRole("radiogroup", { name: "Date" });
    expect(
      within(dateGroup).getByRole("radio", { name: "Today" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("submits with the category name as title when the title is empty, then resets for the next entry", async () => {
    const user = userEvent.setup();
    renderPage();

    const amount = screen.getByLabelText("Amount");
    await user.type(amount, "12.50");
    await user.click(screen.getByRole("radio", { name: /Food/ }));
    await user.click(screen.getByRole("button", { name: "Add Expense" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith({
      id: null,
      title: "Food",
      amount: 12.5,
      date: todayISO(),
      description: "",
      accountId: "acc-card",
      categoryId: "cat-food",
    });

    // Reset for the next entry: amount cleared, account keeps its pick.
    await waitFor(() => expect(screen.getByLabelText("Amount")).toHaveValue(""));
    const accountChips = within(
      screen.getByRole("radiogroup", { name: "Account" }),
    ).getAllByRole("radio");
    expect(
      accountChips.find((c) => c.textContent === "Card"),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("keeps a typed title instead of the category fallback", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Amount"), "8");
    await user.click(screen.getByRole("radio", { name: /Home/ }));
    await user.type(screen.getByLabelText(/Title/), "Light bulbs");
    await user.click(screen.getByRole("button", { name: "Add Expense" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({
      title: "Light bulbs",
      categoryId: "cat-home",
    });
  });

  it("disables submit until amount and category are set", async () => {
    const user = userEvent.setup();
    renderPage();

    const submit = screen.getByRole("button", { name: "Add Expense" });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Amount"), "5");
    expect(submit).toBeDisabled(); // still no category

    await user.click(screen.getByRole("radio", { name: /Food/ }));
    expect(submit).toBeEnabled();
  });

  it("suggests previous titles while typing and prefills category and amount on pick", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/Title/), "Tak");

    const listbox = await screen.findByRole("listbox", { name: "Previous titles" });
    const option = within(listbox).getByRole("option", { name: /Takeaway/ });
    expect(option).toHaveTextContent("Food"); // its usual category
    await user.click(option);

    // Title, usual category and typical amount all prefilled.
    expect(screen.getByLabelText(/Title/)).toHaveValue("Takeaway");
    expect(screen.getByRole("radio", { name: /Food/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByLabelText("Amount")).toHaveValue("25");
    // The list closes after picking.
    expect(screen.queryByRole("listbox", { name: "Previous titles" })).toBeNull();
  });

  it("does not overwrite an already-typed amount when picking a suggestion", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Amount"), "99");
    await user.type(screen.getByLabelText(/Title/), "Tak");
    await user.click(
      within(
        await screen.findByRole("listbox", { name: "Previous titles" }),
      ).getByRole("option", { name: /Takeaway/ }),
    );

    expect(screen.getByLabelText("Amount")).toHaveValue("99");
    expect(screen.getByLabelText(/Title/)).toHaveValue("Takeaway");
  });

  it("shows no suggestions before typing", () => {
    renderPage();
    expect(screen.queryByRole("listbox", { name: "Previous titles" })).toBeNull();
  });

  it("keeps the draft when the create fails", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Amount"), "9");
    await user.click(screen.getByRole("radio", { name: /Food/ }));
    await user.click(screen.getByRole("button", { name: "Add Expense" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("Amount")).toHaveValue("9");
  });
});
