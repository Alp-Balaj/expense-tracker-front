import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import ExpensePage from "@/Pages/ExpensePage";
import * as accountHooks from "@/Hooks/queries/useAccounts";
import * as expenseHooks from "@/Hooks/queries/useExpenses";
import * as categoryHooks from "@/Hooks/queries/useCategories";
import * as reimbursementHooks from "@/Hooks/queries/useReimbursements";
import { CategoryType } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { Category } from "@/Models/Category";
import type { Expense } from "@/Models/Expense";

// Suggestion-5, end to end: choosing a period must move the table, the summary
// cards and the charts together, and survive a reload. This renders the real
// page against fixed fixtures on a fixed date.

vi.mock("@/Hooks/queries/useAccounts");
vi.mock("@/Hooks/queries/useExpenses");
vi.mock("@/Hooks/queries/useCategories");
vi.mock("@/Hooks/queries/useReimbursements");

vi.mock("@/Hooks/useCurrency", () => ({
  useCurrency: () => ({
    userCurrencyCode: "EUR",
    currenciesMap: {},
    convert: (amount: number) => amount,
    format: (amount: number) => `€${amount.toFixed(2)}`,
    formatOriginal: (amount: number) => `€${amount.toFixed(2)}`,
  }),
}));

const TODAY = new Date(2026, 6, 15, 9, 0, 0); // 15 July 2026, local

const accounts: Account[] = [
  {
    id: "acc-1",
    name: "Main Checking",
    amountType: 0,
    balance: 1000,
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
  {
    id: "cat-home",
    name: "Home",
    categoryType: CategoryType.Expense,
    color: "#8b5cf6",
    description: "",
  } as Category,
];

const expenses: Expense[] = [
  // July — the current month
  { id: "e1", title: "July Groceries", amount: 100, date: "2026-07-03", description: "", accountId: "acc-1", categoryId: "cat-food" },
  { id: "e2", title: "July Rent", amount: 900, date: "2026-07-01", description: "", accountId: "acc-1", categoryId: "cat-home" },
  // June — last month
  { id: "e3", title: "June Groceries", amount: 250, date: "2026-06-12", description: "", accountId: "acc-1", categoryId: "cat-food" },
  // May — outside both
  { id: "e4", title: "May Cinema", amount: 40, date: "2026-05-20", description: "", accountId: "acc-1", categoryId: "cat-food" },
];

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

  // None of these fixtures is a split bill, so the list has no receivable to
  // badge or settle.
  vi.mocked(reimbursementHooks).useReimbursementsQuery.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof reimbursementHooks.useReimbursementsQuery>);
  vi.mocked(reimbursementHooks).useSettleReimbursement.mockReturnValue({
    mutateAsync: vi.fn(),
  } as unknown as ReturnType<typeof reimbursementHooks.useSettleReimbursement>);

  // The list holds mutation handles; nothing here submits.
  vi.mocked(expenseHooks).useCreateExpense.mockReturnValue({
    mutateAsync: vi.fn(),
  } as unknown as ReturnType<typeof expenseHooks.useCreateExpense>);
  vi.mocked(expenseHooks).useUpdateExpense.mockReturnValue({
    mutateAsync: vi.fn(),
  } as unknown as ReturnType<typeof expenseHooks.useUpdateExpense>);
  vi.mocked(expenseHooks).useDeleteExpense.mockReturnValue({
    mutateAsync: vi.fn(),
  } as unknown as ReturnType<typeof expenseHooks.useDeleteExpense>);
}

/** The expense form inside the list reaches for a router. */
function renderPage() {
  return render(
    <MemoryRouter>
      <ExpensePage />
    </MemoryRouter>,
  );
}

/** The rendered table body, so assertions ignore chart labels and card text. */
function tableRows() {
  return screen.getByRole("table");
}

/**
 * The "Expenses" summary card. Scoped because the period total and the
 * average-per-entry card show the same figure when the period holds one entry.
 */
function totalCard(): HTMLElement {
  const card = screen.getByText("Expenses").closest("[data-slot='card']");
  if (!card) throw new Error("Expenses summary card not found");
  return card as HTMLElement;
}

async function selectPeriod(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole("combobox", { name: /period/i }));
  await user.click(await screen.findByRole("option", { name: label }));
}

describe("ExpensePage period selection", () => {
  beforeAll(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockQueries();
  });

  it("opens on the current month", () => {
    renderPage();

    const table = tableRows();
    expect(within(table).getByText("July Groceries")).toBeInTheDocument();
    expect(within(table).getByText("July Rent")).toBeInTheDocument();
    expect(within(table).queryByText("June Groceries")).not.toBeInTheDocument();
    expect(within(table).queryByText("May Cinema")).not.toBeInTheDocument();
  });

  it("moves the table, the cards and the chart caption together", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    // This month: 100 + 900.
    expect(within(totalCard()).getByText("€1000.00")).toBeInTheDocument();

    await selectPeriod(user, "Last month");

    await waitFor(() =>
      expect(within(tableRows()).getByText("June Groceries")).toBeInTheDocument(),
    );

    const table = tableRows();
    expect(within(table).queryByText("July Rent")).not.toBeInTheDocument();
    expect(within(table).queryByText("May Cinema")).not.toBeInTheDocument();

    // The summary card follows the period, and compares against May (40).
    expect(within(totalCard()).getByText("€250.00")).toBeInTheDocument();
    expect(within(totalCard()).getByText(/525\.0% vs previous/)).toBeInTheDocument();

    // The chart caption follows it too.
    expect(screen.getByText(/breakdown of your spending — last month/i)).toBeInTheDocument();
  });

  it("counts the entries in the selected period", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    expect(screen.getByText(/this month — 2 entries/i)).toBeInTheDocument();

    await selectPeriod(user, "Last month");

    await waitFor(() =>
      expect(screen.getByText(/last month — 1 entry/i)).toBeInTheDocument(),
    );
  });

  it("remembers the choice across a reload", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const first = renderPage();

    await selectPeriod(user, "Last month");
    await waitFor(() =>
      expect(within(tableRows()).getByText("June Groceries")).toBeInTheDocument(),
    );

    first.unmount();
    renderPage();

    expect(within(tableRows()).getByText("June Groceries")).toBeInTheDocument();
    expect(within(tableRows()).queryByText("July Rent")).not.toBeInTheDocument();
  });

  it("shows the whole history for all time", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await selectPeriod(user, "All time");

    await waitFor(() =>
      expect(within(tableRows()).getByText("May Cinema")).toBeInTheDocument(),
    );
    const table = tableRows();
    expect(within(table).getByText("July Rent")).toBeInTheDocument();
    expect(within(table).getByText("June Groceries")).toBeInTheDocument();
  });
});

describe("ExpensePage category and amount filters", () => {
  beforeAll(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockQueries();
  });

  const openFilters = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: /filter/i }));
  };

  // The acceptance criterion: a filter has to read consistently everywhere,
  // not just in the table.
  it("moves the table and the summary card together", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    expect(within(totalCard()).getByText("€1000.00")).toBeInTheDocument();

    await openFilters(user);
    await user.click(screen.getByLabelText("Home"));

    // July, Home only: the 900 rent survives, the 100 groceries do not.
    await waitFor(() =>
      expect(within(tableRows()).queryByText("July Groceries")).not.toBeInTheDocument(),
    );
    expect(within(tableRows()).getByText("July Rent")).toBeInTheDocument();
    expect(within(totalCard()).getByText("€900.00")).toBeInTheDocument();
  });

  it("combines with the period rather than replacing it", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await openFilters(user);
    await user.click(screen.getByLabelText("Food"));
    await waitFor(() =>
      expect(within(tableRows()).queryByText("July Rent")).not.toBeInTheDocument(),
    );

    // Food + last month leaves only the June row.
    await user.keyboard("{Escape}");
    await selectPeriod(user, "Last month");

    await waitFor(() =>
      expect(within(tableRows()).getByText("June Groceries")).toBeInTheDocument(),
    );
    expect(within(tableRows()).queryByText("July Groceries")).not.toBeInTheDocument();
    expect(screen.getByText(/last month — 1 entry/i)).toBeInTheDocument();
  });

  it("filters by an amount range", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await openFilters(user);
    await user.type(screen.getByLabelText("Minimum amount"), "500");

    await waitFor(() =>
      expect(within(tableRows()).queryByText("July Groceries")).not.toBeInTheDocument(),
    );
    expect(within(tableRows()).getByText("July Rent")).toBeInTheDocument();
  });

  it("clears every filter at once", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await openFilters(user);
    await user.click(screen.getByLabelText("Home"));
    await waitFor(() =>
      expect(within(tableRows()).queryByText("July Groceries")).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    await waitFor(() =>
      expect(within(tableRows()).getByText("July Groceries")).toBeInTheDocument(),
    );
    expect(within(totalCard()).getByText("€1000.00")).toBeInTheDocument();
  });
});
