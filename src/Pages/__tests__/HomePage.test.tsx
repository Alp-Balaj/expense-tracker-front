import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import HomePage from "@/Pages/HomePage";
import * as accountHooks from "@/Hooks/queries/useAccounts";
import * as expenseHooks from "@/Hooks/queries/useExpenses";
import * as incomeHooks from "@/Hooks/queries/useIncomes";
import * as plannedHooks from "@/Hooks/queries/usePlannedTransactions";
import * as categoryHooks from "@/Hooks/queries/useCategories";
import * as budgetHooks from "@/Hooks/queries/useBudgets";
import * as insightHooks from "@/Hooks/queries/useInsights";
import * as cashflowHooks from "@/Hooks/queries/useCashflow";
import { AmountType, CategoryType } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { BudgetStatus } from "@/Models/Budget";
import type { Category } from "@/Models/Category";
import type { Expense } from "@/Models/Expense";
import type { PlannedTransaction } from "@/Models/PlannedTransaction";
import type { Income } from "@/Models/Income";
import type { Insights } from "@/Models/Insights";
import type { CashflowProjection } from "@/Models/Cashflow";
import { PlannedKind, Recurrence } from "@/Enums/enums";

// The dashboard is almost entirely derived data. This renders the real page
// against fixed fixtures on a fixed date, so the figures it puts on screen —
// safe to spend, the daily allowance, liquidity, the next bill, the detected
// subscription — are checked end to end and not just unit by unit.

vi.mock("@/Hooks/queries/useAccounts");
vi.mock("@/Hooks/queries/useExpenses");
vi.mock("@/Hooks/queries/useIncomes");
vi.mock("@/Hooks/queries/usePlannedTransactions");
vi.mock("@/Hooks/queries/useCategories");
vi.mock("@/Hooks/queries/useBudgets");
vi.mock("@/Hooks/queries/useInsights");
vi.mock("@/Hooks/queries/useCashflow");

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

/**
 * Schedules whose next date is still ahead, so the widget shows them as a
 * look-ahead. Nothing has fallen due on the pinned date, which is why the queue
 * below is empty — the server only materialises an occurrence on the day.
 */
function plannedPlan(
  id: string,
  title: string,
  amount: number,
  nextDueDate: string,
  kind: PlannedKind = PlannedKind.Expense,
): PlannedTransaction {
  return {
    id,
    title,
    amount,
    description: null,
    kind,
    categoryId: "cat-general",
    fromAccountId: "acc-checking",
    toAccountId: null,
    savingGoalId: null,
    recurrence: Recurrence.Monthly,
    startDate: "2026-01-01",
    endDate: null,
    isActive: true,
    nextDueDate,
    pendingCount: 0,
  };
}

const plans: PlannedTransaction[] = [
  plannedPlan("f1", "Gym membership", 29, "2026-08-10"),
  plannedPlan("f2", "Car insurance", 412, "2026-07-29"),
  plannedPlan("f3", "Rent — August", 1150, "2026-08-01"),
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

/** What the insights endpoint reports for July: eating out hot, groceries cooling. */
const insightsFixture: Insights = {
  month: "2026-07",
  baseCurrency: "EUR",
  hasMissingRates: false,
  monthsWithHistory: 3,
  currentMonthTotal: 1232.61,
  previousMonthTotal: 1100,
  trailingAverage: 1000,
  overallVsAveragePct: 23.26,
  categories: [
    {
      categoryId: "cat-eat",
      categoryName: "Eating out",
      categoryColor: null,
      currentMonthTotal: 280,
      previousMonthTotal: 210,
      momChangeAmount: 70,
      momChangePct: 33.33,
      trailingAverage: 200,
      vsAveragePct: 40,
    },
    {
      categoryId: "cat-gro",
      categoryName: "Groceries",
      categoryColor: null,
      currentMonthTotal: 264,
      previousMonthTotal: 300,
      momChangeAmount: -36,
      momChangePct: -12,
      trailingAverage: 270,
      // Too close to the average for a sentence, so the MoM drop speaks.
      vsAveragePct: -2.22,
    },
  ],
};

const cashflowFixture: CashflowProjection = {
  month: "2026-07",
  baseCurrency: "EUR",
  hasMissingRates: false,
  today: "2026-07-27",
  endOfMonth: "2026-07-31",
  startingBalance: 2937,
  dailyBurnRate: 14.76,
  projectedEndOfMonthBalance: 2878.96,
  projectedEndBalance: 2495.2,
  points: [
    { date: "2026-07-27", projectedBalance: 2937, plannedOutflow: 0, plannedInflow: 0 },
    { date: "2026-07-28", projectedBalance: 2922.24, plannedOutflow: 0, plannedInflow: 0 },
    { date: "2026-07-29", projectedBalance: 2907.48, plannedOutflow: 0, plannedInflow: 0 },
    { date: "2026-07-30", projectedBalance: 2892.72, plannedOutflow: 0, plannedInflow: 0 },
    { date: "2026-07-31", projectedBalance: 2878.96, plannedOutflow: 0, plannedInflow: 0 },
    { date: "2026-08-26", projectedBalance: 2495.2, plannedOutflow: 0, plannedInflow: 0 },
  ],
};

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
  vi.mocked(plannedHooks).usePlannedTransactionsQuery.mockReturnValue({
    data: plans,
    isLoading: false,
  } as never);
  vi.mocked(plannedHooks).usePlannedOccurrencesQuery.mockReturnValue({
    data: [],
    isLoading: false,
  } as never);
  vi.mocked(plannedHooks).useCommitOccurrence.mockReturnValue({
    mutateAsync: vi.fn(),
  } as never);
  vi.mocked(categoryHooks).useCategoriesQuery.mockReturnValue({
    data: categories,
    isLoading: false,
  } as never);
  vi.mocked(budgetHooks).useBudgetStatusQuery.mockReturnValue({
    data: statuses,
    isLoading: false,
  } as never);
  vi.mocked(insightHooks).useInsightsQuery.mockReturnValue({
    data: insightsFixture,
    isLoading: false,
  } as never);
  vi.mocked(cashflowHooks).useCashflowProjectionQuery.mockReturnValue({
    data: cashflowFixture,
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
    expect(screen.getByText("−€412.00")).toBeInTheDocument();
    // All three land inside the fortnight: 412 + 1150 + 29.
    expect(screen.getByText(/€1591\.00 in 14d/)).toBeInTheDocument();
  });

  it("marks a planned income as money coming in", () => {
    // Lands before the car insurance, so it takes the widget's lead block.
    vi.mocked(plannedHooks).usePlannedTransactionsQuery.mockReturnValue({
      data: [...plans, plannedPlan("f4", "Salary", 3200, "2026-07-28", PlannedKind.Income)],
      isLoading: false,
    } as never);
    renderDashboard();

    // The sign carries the direction without relying on colour, and the kind is
    // spoken for anyone who cannot see either.
    expect(screen.getByText("+€3200.00")).toBeInTheDocument();
    expect(screen.getByText("Income:")).toBeInTheDocument();
    // Money in is never netted against the fortnight's bills.
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

  it("reads the month's insights as sentences, biggest signal first", () => {
    renderDashboard();

    const panel = within(screen.getByTestId("insights-panel"));
    expect(panel.getByText("Overall spending is 23% above your usual month.")).toBeInTheDocument();
    expect(panel.getByText("Eating out is 40% above your usual.")).toBeInTheDocument();
    expect(panel.getByText("Groceries down 12% vs last month.")).toBeInTheDocument();
  });

  it("admits it cannot compare against history it does not have", () => {
    vi.mocked(insightHooks).useInsightsQuery.mockReturnValue({
      data: {
        ...insightsFixture,
        monthsWithHistory: 0,
        trailingAverage: null,
        overallVsAveragePct: null,
        previousMonthTotal: 0,
      },
      isLoading: false,
    } as never);
    renderDashboard();

    const panel = within(screen.getByTestId("insights-panel"));
    expect(panel.getByText(/Not enough history yet/)).toBeInTheDocument();
    expect(panel.queryByText(/above your usual/)).not.toBeInTheDocument();
  });

  it("projects the cash flow to the end of the month", () => {
    renderDashboard();

    // The headline carries the number on phones, where the chart is hidden.
    expect(screen.getByTestId("cashflow-projected")).toHaveTextContent("€2878.96");
    expect(screen.getByText(/Burn €14\.76\/day/)).toBeInTheDocument();
    // The window's lowest day and where it ends, date left to the locale.
    expect(screen.getByTestId("cashflow-note")).toHaveTextContent(
      /Lowest point €2495\.20 around .*, ending the window at €2495\.20\./,
    );
  });

  it("warns when the projection dips below zero", () => {
    vi.mocked(cashflowHooks).useCashflowProjectionQuery.mockReturnValue({
      data: {
        ...cashflowFixture,
        points: [
          ...cashflowFixture.points,
          { date: "2026-08-01", projectedBalance: -120.5, plannedOutflow: 1150, plannedInflow: 0 },
        ],
      },
      isLoading: false,
    } as never);
    renderDashboard();

    expect(screen.getByTestId("cashflow-note")).toHaveTextContent(/Dips below zero around/);
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
