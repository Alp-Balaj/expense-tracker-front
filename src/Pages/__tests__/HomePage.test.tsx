import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import HomePage from "@/Pages/HomePage";
import * as accountHooks from "@/Hooks/queries/useAccounts";
import * as expenseHooks from "@/Hooks/queries/useExpenses";
import * as incomeHooks from "@/Hooks/queries/useIncomes";
import * as futureExpenseHooks from "@/Hooks/queries/useFutureExpenses";
import * as categoryHooks from "@/Hooks/queries/useCategories";
import * as budgetHooks from "@/Hooks/queries/useBudgets";
import { AmountType, CategoryType } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { BudgetStatus } from "@/Models/Budget";
import type { Category } from "@/Models/Category";
import type { Expense } from "@/Models/Expense";
import type { FutureExpense } from "@/Models/FutureExpense";
import type { Income } from "@/Models/Income";

// The dashboard is almost entirely derived data. This renders the real page
// against fixed fixtures on a fixed date, so the figures it puts on screen —
// safe to spend, the daily allowance, liquidity, the next bill, the detected
// subscription — are checked end to end and not just unit by unit.

vi.mock("@/Hooks/queries/useAccounts");
vi.mock("@/Hooks/queries/useExpenses");
vi.mock("@/Hooks/queries/useIncomes");
vi.mock("@/Hooks/queries/useFutureExpenses");
vi.mock("@/Hooks/queries/useCategories");
vi.mock("@/Hooks/queries/useBudgets");

vi.mock("@/Hooks/useCurrency", () => ({
  useCurrency: () => ({
    userCurrencyCode: "EUR",
    currenciesMap: {},
    convert: (amount: number) => amount,
    // Shaped like Intl's en-* currency output: sign outside the symbol.
    format: (amount: number) => `${amount < 0 ? "-" : ""}€${Math.abs(amount).toFixed(2)}`,
    formatOriginal: (amount: number) => `€${Math.abs(amount).toFixed(2)}`,
  }),
}));

vi.mock("@/Authorization/AuthContext", () => ({ useAuth: () => ({ username: "alp" }) }));

// The log-something forms live in the shell now; the page only asks for them.
vi.mock("@/Components/Layout/useQuickLog", () => ({
  useQuickLog: () => ({ logExpense: vi.fn(), logIncome: vi.fn(), logSaving: vi.fn(), logTransfer: vi.fn() }),
}));

const TODAY = new Date(2026, 6, 27, 9, 0, 0); // Monday 27 July 2026, 09:00 local

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
    id: "acc-cash",
    name: "Cash Wallet",
    amountType: AmountType.Cash,
    balance: 137,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
  {
    id: "acc-savings",
    name: "Rainy Day",
    amountType: AmountType.SavingsAccount,
    balance: 800,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
  {
    id: "acc-credit",
    name: "Visa Credit",
    amountType: AmountType.CreditCard,
    balance: -450,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
];

function expense(
  id: string,
  date: string,
  title: string,
  amount: number,
  accountId = "acc-checking",
): Expense {
  return { id, title, amount, date, description: "", accountId, categoryId: "cat-general" };
}

const expenses: Expense[] = [
  expense("e1", "2026-07-01", "Rent — July", 1150),
  expense("e2", "2026-07-05", "Lidl groceries", 68.42),
  expense("e3", "2026-07-27", "Flat white", 3.2, "acc-cash"),
  // Three months of the same charge, so the subscription detector fires.
  expense("s1", "2026-05-04", "Spotify Premium", 10.99),
  expense("s2", "2026-06-04", "Spotify Premium", 10.99),
  expense("s3", "2026-07-04", "Spotify Premium", 10.99),
];

const incomes: Income[] = [
  {
    id: "i1",
    title: "Freelance invoice #24",
    amount: 270,
    date: "2026-07-24",
    description: "",
    accountId: "acc-checking",
    categoryId: "cat-general",
  },
];

const futureExpenses: FutureExpense[] = [
  { id: "f1", title: "Gym membership", amount: 29, date: "2026-08-10", categoryId: "c", description: "" },
  { id: "f2", title: "Car insurance", amount: 412, date: "2026-07-29", categoryId: "c", description: "" },
  { id: "f3", title: "Rent — August", amount: 1150, date: "2026-08-01", categoryId: "c", description: "" },
];

const categories: Category[] = [
  {
    id: "cat-general",
    name: "Everyday",
    description: "",
    categoryType: CategoryType.Expense,
    totalAmount: null,
    color: "#000",
  },
];

function budgetStatus(overrides: Partial<BudgetStatus>): BudgetStatus {
  return {
    id: "b",
    categoryId: "cat-general",
    categoryName: "Everyday",
    categoryColor: null,
    note: null,
    period: 0,
    month: "2026-07",
    limit: 300,
    spent: 100,
    remaining: 200,
    percentUsed: 33.3,
    baseCurrency: "EUR",
    subtotals: [],
    hasMissingRates: false,
    ...overrides,
  };
}

/** The month-wide budget the hero measures against. */
const overallBudget = budgetStatus({
  id: "b-overall",
  categoryId: null,
  categoryName: "All categories",
  limit: 2200,
  spent: 1847.32,
  remaining: 352.68,
  percentUsed: 83.97,
});

function mockQueries(statuses: BudgetStatus[]) {
  vi.mocked(accountHooks).useAccountsQuery.mockReturnValue({
    data: accounts,
    isLoading: false,
  } as never);
  vi.mocked(expenseHooks).useExpensesQuery.mockReturnValue({
    data: expenses,
    isLoading: false,
  } as never);
  vi.mocked(incomeHooks).useIncomesQuery.mockReturnValue({
    data: incomes,
    isLoading: false,
  } as never);
  vi.mocked(futureExpenseHooks).useFutureExpensesQuery.mockReturnValue({
    data: futureExpenses,
    isLoading: false,
  } as never);
  vi.mocked(categoryHooks).useCategoriesQuery.mockReturnValue({
    data: categories,
    isLoading: false,
  } as never);
  vi.mocked(budgetHooks).useBudgetStatusQuery.mockReturnValue({
    data: statuses,
    isLoading: false,
  } as never);
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe("HomePage dashboard", () => {
  beforeAll(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueries([overallBudget, budgetStatus({ id: "b-food", spent: 268.42, percentUsed: 89.5 })]);
  });

  it("leads with what is safe to spend and what that is per day", () => {
    renderDashboard();

    // 27 July of a 31-day month leaves the 27th through the 31st.
    expect(screen.getByText(/Safe to spend · 5 days left in July/i)).toBeInTheDocument();
    expect(screen.getByTestId("hero-amount")).toHaveTextContent("€352.68");
    // €352.68 spread over the 5 remaining days.
    expect(screen.getByText(/€70\.54 a day/)).toBeInTheDocument();
    expect(screen.getByText(/€1847\.32/)).toBeInTheDocument();
    expect(screen.getByText(/84% used · pace 87%/)).toBeInTheDocument();
  });

  it("greets by name and dates the page", () => {
    renderDashboard();
    expect(screen.getByRole("heading", { name: "Good morning, alp" })).toBeInTheDocument();
  });

  it("summarises liquidity, runway and the month's net", () => {
    renderDashboard();

    // Checking + cash + savings; the credit card is not spendable.
    expect(screen.getByText(/Liquid · 3 of 4/i)).toBeInTheDocument();
    expect(screen.getByText("€2937.00")).toBeInTheDocument();
    // €270 in against €1232.61 out this month.
    expect(screen.getByText("-€962.61")).toBeInTheDocument();
    // €1254.59 over the 85 days since the oldest expense is €14.76/day,
    // which stretches €2937 of liquid balance to 198 days.
    expect(screen.getByText("198 days")).toBeInTheDocument();
  });

  it("pulls the nearest planned expense out of the queue", () => {
    renderDashboard();

    expect(screen.getByText("Car insurance")).toBeInTheDocument();
    expect(screen.getByText("2d")).toBeInTheDocument();
    expect(screen.getByText("€412.00")).toBeInTheDocument();
    // All three land inside the fortnight: 412 + 1150 + 29.
    expect(screen.getByText(/€1591\.00 in 14d/)).toBeInTheDocument();
  });

  it("infers the monthly subscription from three months of history", () => {
    renderDashboard();

    const panel = within(screen.getByTestId("recurring-panel"));
    expect(panel.getByText("Spotify Premium")).toBeInTheDocument();
    expect(panel.getByText(/1 subscription found/i)).toBeInTheDocument();
    expect(screen.getByTestId("recurring-total")).toHaveTextContent("€10.99");
  });

  it("shows the ledger newest first, with income marked apart from spend", () => {
    renderDashboard();

    const rows = screen.getAllByTestId("ledger-row");
    expect(rows[0]).toHaveTextContent("Flat white");
    expect(rows[0]).toHaveTextContent("−€3.20");
    expect(rows[1]).toHaveTextContent("Freelance invoice #24");
    expect(rows[1]).toHaveTextContent("+€270.00");
    expect(rows[0]).toHaveTextContent("Cash Wallet · Everyday");
  });

  it("charts the month and marks today", () => {
    renderDashboard();

    // Rent on the 1st is the month's peak, so it tops the legend.
    expect(screen.getByTitle("1 July — €1150.00")).toBeInTheDocument();
    expect(screen.getByTitle("27 July — €3.20")).toBeInTheDocument();
    expect(screen.getByTitle("2 July — nothing logged")).toBeInTheDocument();
    expect(screen.getByTitle("31 July — still to come")).toBeInTheDocument();
  });

  it("falls back to plain spend when nothing budgets the whole month", () => {
    vi.clearAllMocks();
    mockQueries([budgetStatus({ id: "b-food" })]);
    renderDashboard();

    expect(screen.getByText(/Spent in July · 5 days left/i)).toBeInTheDocument();
    // The month's expenses, since there is no limit to subtract them from.
    expect(screen.getByTestId("hero-amount")).toHaveTextContent("€1232.61");
    expect(screen.getByRole("button", { name: "Set a budget" })).toBeInTheDocument();
  });
});
