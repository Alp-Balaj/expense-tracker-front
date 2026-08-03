import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import ExpenseList from "@/Components/Lists/ExpenseList";
import * as accountHooks from "@/Hooks/queries/useAccounts";
import * as categoryHooks from "@/Hooks/queries/useCategories";
import * as expenseHooks from "@/Hooks/queries/useExpenses";
import * as reimbursementHooks from "@/Hooks/queries/useReimbursements";
import { CategoryType } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { Category } from "@/Models/Category";
import type { Expense } from "@/Models/Expense";
import type { Reimbursement } from "@/Models/Reimbursement";

// The expense table's half of the reimbursement feature: a row says when part
// of it is coming back, and offers to record the payback — but only where there
// is one. An ordinary expense must look and behave exactly as it always did.

vi.mock("@/Hooks/queries/useAccounts");
vi.mock("@/Hooks/queries/useCategories");
vi.mock("@/Hooks/queries/useExpenses");
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

const accounts: Account[] = [
  {
    id: "acc-card",
    name: "Visa Credit",
    amountType: 0,
    balance: -200,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
  {
    id: "acc-cash",
    name: "Cash Wallet",
    amountType: 2,
    balance: 60,
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

/** An ordinary expense: nothing is coming back on it. */
const plain: Expense = {
  id: "e1",
  title: "Groceries",
  amount: 42.5,
  date: "2026-07-25",
  description: "",
  accountId: "acc-card",
  categoryId: "cat-food",
};

/** A 60 dinner where 40 was owed and 15 has already come back. */
const splitRow: Expense = {
  id: "e2",
  title: "Dinner Sat",
  amount: 60,
  date: "2026-07-21",
  description: "",
  accountId: "acc-card",
  categoryId: "cat-food",
  expectedReimbursement: 40,
  settledReimbursement: 15,
  openReimbursement: 25,
};

/** Owed once, fully paid back — no longer a receivable. */
const settledRow: Expense = {
  id: "e3",
  title: "Taxi share",
  amount: 30,
  date: "2026-07-19",
  description: "",
  accountId: "acc-cash",
  categoryId: "cat-food",
  expectedReimbursement: 15,
  settledReimbursement: 15,
  openReimbursement: 0,
};

const reimbursements: Reimbursement[] = [
  {
    id: "r2",
    expenseId: "e2",
    expenseTitle: "Dinner Sat",
    expenseDate: "2026-07-21",
    expenseAmount: 60,
    expectedAmount: 40,
    settledAmount: 15,
    openAmount: 25,
    currencyCode: "EUR",
    daysOpen: 6,
    settlements: [],
  },
];

const settle = vi.fn();

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
    data: [plain, splitRow, settledRow],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof expenseHooks.useExpensesQuery>);

  vi.mocked(reimbursementHooks).useReimbursementsQuery.mockReturnValue({
    data: reimbursements,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof reimbursementHooks.useReimbursementsQuery>);

  vi.mocked(reimbursementHooks).useSettleReimbursement.mockReturnValue({
    mutateAsync: settle,
  } as unknown as ReturnType<typeof reimbursementHooks.useSettleReimbursement>);

  for (const hook of ["useCreateExpense", "useUpdateExpense", "useDeleteExpense"] as const) {
    vi.mocked(expenseHooks)[hook].mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<(typeof expenseHooks)[typeof hook]>);
  }
}

/** The list holds the expense form, which reaches for a router. */
function renderList() {
  return render(
    <MemoryRouter>
      <ExpenseList />
    </MemoryRouter>,
  );
}

function rowFor(title: string): HTMLElement {
  const cell = screen.getByText(title).closest("tr");
  if (!cell) throw new Error(`No table row for "${title}"`);
  return cell as HTMLElement;
}

async function openRowMenu(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(within(rowFor(title)).getByRole("button", { name: /open menu/i }));
}

describe("ExpenseList reimbursement badge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueries();
  });

  it("marks only the row that still has money coming back", () => {
    renderList();

    expect(within(rowFor("Dinner Sat")).getByTestId("owed-badge")).toHaveTextContent(
      "owed €25.00",
    );
    expect(within(rowFor("Groceries")).queryByTestId("owed-badge")).not.toBeInTheDocument();
    // Fully settled: the split happened, but there is nothing outstanding to say.
    expect(within(rowFor("Taxi share")).queryByTestId("owed-badge")).not.toBeInTheDocument();
  });

  it("leaves the amount column showing the gross", () => {
    renderList();
    // 60 left the account; the badge is what tells the rest of the story.
    expect(within(rowFor("Dinner Sat")).getByText("€60.00")).toBeInTheDocument();
  });
});

describe("ExpenseList settle action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueries();
  });

  it("offers Settle only where there is something to settle", async () => {
    const user = userEvent.setup();
    renderList();

    await openRowMenu(user, "Dinner Sat");
    expect(await screen.findByRole("menuitem", { name: "Settle" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await openRowMenu(user, "Groceries");
    expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Settle" })).not.toBeInTheDocument();
  });

  it("never hides the actions every row has", async () => {
    const user = userEvent.setup();
    renderList();

    await openRowMenu(user, "Taxi share");
    expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Copy Expense ID" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Settle" })).not.toBeInTheDocument();
  });

  it("opens the dialog with the amount defaulted to what is still open", async () => {
    const user = userEvent.setup();
    renderList();

    await openRowMenu(user, "Dinner Sat");
    await user.click(await screen.findByRole("menuitem", { name: "Settle" }));

    // 40 was owed and 15 came back, so the obvious settlement is the other 25 —
    // not the 40 that was originally expected.
    const amount = await screen.findByLabelText("Paid back");
    expect(amount).toHaveValue("25");
    expect(screen.getByTestId("settle-remainder")).toHaveTextContent(
      "€25.00 open — this settles it in full.",
    );
  });

  it("says what a partial payback would leave outstanding", async () => {
    const user = userEvent.setup();
    renderList();

    await openRowMenu(user, "Dinner Sat");
    await user.click(await screen.findByRole("menuitem", { name: "Settle" }));

    const amount = await screen.findByLabelText("Paid back");
    await user.clear(amount);
    await user.type(amount, "10");

    expect(screen.getByTestId("settle-remainder")).toHaveTextContent(
      "€25.00 open — €15.00 will still be out after this.",
    );
  });

  it("posts the settlement against the receivable, into the account chosen here", async () => {
    const user = userEvent.setup();
    renderList();

    await openRowMenu(user, "Dinner Sat");
    await user.click(await screen.findByRole("menuitem", { name: "Settle" }));

    // The dinner left the credit card; the payback lands in cash. Any account
    // the user owns is a legal target.
    await user.click(await screen.findByRole("radio", { name: "Cash Wallet" }));
    await user.click(screen.getByRole("button", { name: "Record settlement" }));

    expect(settle).toHaveBeenCalledTimes(1);
    expect(settle.mock.calls[0][0]).toMatchObject({
      id: "r2",
      settlement: { accountId: "acc-cash", amount: 25 },
    });
  });
});
