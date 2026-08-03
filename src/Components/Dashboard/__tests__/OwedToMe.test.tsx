import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OwedToMe } from "@/Components/Dashboard/OwedToMe";
import * as accountHooks from "@/Hooks/queries/useAccounts";
import * as reimbursementHooks from "@/Hooks/queries/useReimbursements";
import { AmountType } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { Expense } from "@/Models/Expense";
import type { Reimbursement } from "@/Models/Reimbursement";

// The dashboard panel for money that left the account but was never yours to
// spend. Three things matter here: it must be invisible to the many users who
// never split a bill; when it does appear it must lead with the oldest debt,
// because age is what makes a receivable worth acting on; and it must be able
// to clear one, since noticing a debt and doing nothing about it is what the
// panel exists to prevent.

vi.mock("@/Hooks/queries/useAccounts");
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

const TODAY = new Date(2026, 6, 27, 9, 0, 0); // 27 July 2026, local

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: "e",
    title: "Something",
    amount: 10,
    date: "2026-07-20",
    description: "",
    accountId: "acc-1",
    categoryId: "cat-1",
    ...overrides,
  };
}

/**
 * 320 fronted this month, of which 180 has already come back — so the sentence
 * and the headline have to be two different numbers.
 */
const expenses: Expense[] = [
  expense({ id: "e0", title: "Groceries", amount: 42.5, date: "2026-07-25" }),
  expense({
    id: "e1",
    title: "Dinner Sat",
    amount: 80,
    date: "2026-07-21",
    expectedReimbursement: 40,
    settledReimbursement: 0,
    openReimbursement: 40,
  }),
  expense({
    id: "e2",
    title: "Concert tickets",
    amount: 400,
    date: "2026-07-08",
    expectedReimbursement: 280,
    settledReimbursement: 180,
    openReimbursement: 100,
  }),
];

function receivable(overrides: Partial<Reimbursement>): Reimbursement {
  return {
    id: "r",
    expenseId: "e",
    expenseTitle: "Something",
    expenseDate: "2026-07-20",
    expenseAmount: 10,
    expectedAmount: 5,
    settledAmount: 0,
    openAmount: 5,
    currencyCode: "EUR",
    daysOpen: 7,
    settlements: [],
    ...overrides,
  };
}

// Deliberately youngest-first, so the panel's own sorting is what is under test.
const reimbursements: Reimbursement[] = [
  receivable({
    id: "r1",
    expenseId: "e1",
    expenseTitle: "Dinner Sat",
    expenseDate: "2026-07-21",
    expenseAmount: 80,
    expectedAmount: 40,
    openAmount: 40,
    daysOpen: 6,
  }),
  receivable({
    id: "r2",
    expenseId: "e2",
    expenseTitle: "Concert tickets",
    expenseDate: "2026-07-08",
    expenseAmount: 400,
    expectedAmount: 280,
    settledAmount: 180,
    openAmount: 100,
    daysOpen: 19,
  }),
];

const accounts: Account[] = [
  {
    id: "acc-card",
    name: "Visa Credit",
    amountType: AmountType.CreditCard,
    balance: -200,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
  {
    id: "acc-cash",
    name: "Cash Wallet",
    amountType: AmountType.Cash,
    balance: 60,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
];

const settle = vi.fn();

function mockQueries() {
  vi.mocked(accountHooks).useAccountsQuery.mockReturnValue({
    data: accounts,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof accountHooks.useAccountsQuery>);

  vi.mocked(reimbursementHooks).useSettleReimbursement.mockReturnValue({
    mutateAsync: settle,
  } as unknown as ReturnType<typeof reimbursementHooks.useSettleReimbursement>);
}

describe("OwedToMe panel", () => {
  beforeAll(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueries();
  });

  // The rule Alp set: a user who never splits a bill must not gain a dead card.
  it("renders nothing at all without receivables", () => {
    const { container } = render(
      <OwedToMe reimbursements={[]} expenses={[expenses[0]]} isLoading={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while it does not yet know", () => {
    // No skeleton either: a placeholder that resolves to nothing is a flicker.
    const { container } = render(
      <OwedToMe reimbursements={[]} expenses={expenses} isLoading />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("leads with the total still out", () => {
    render(<OwedToMe reimbursements={reimbursements} expenses={expenses} isLoading={false} />);
    expect(screen.getByTestId("owed-total")).toHaveTextContent("€140.00");
  });

  it("says what was fronted and what is still out, as two different figures", () => {
    render(<OwedToMe reimbursements={reimbursements} expenses={expenses} isLoading={false} />);
    expect(screen.getByTestId("owed-note")).toHaveTextContent(
      "You fronted €320.00 for others this month; €140.00 is still out.",
    );
  });

  it("lists the open receivables most-aged first, with their age", () => {
    render(<OwedToMe reimbursements={reimbursements} expenses={expenses} isLoading={false} />);

    const rows = screen.getAllByTestId("owed-row");
    expect(rows).toHaveLength(2);
    // 19 days beats 6, even though the dinner is the more recent bill.
    expect(rows[0]).toHaveTextContent("Concert tickets");
    expect(rows[0]).toHaveTextContent("€100.00");
    expect(rows[0]).toHaveTextContent("19d open");
    expect(rows[1]).toHaveTextContent("Dinner Sat");
    expect(rows[1]).toHaveTextContent("€40.00");
    expect(rows[1]).toHaveTextContent("6d open");
  });

  it("leaves last month's fronting out of this month's sentence", () => {
    const older = expense({
      id: "e3",
      title: "June trip",
      amount: 300,
      date: "2026-06-14",
      expectedReimbursement: 150,
      settledReimbursement: 150,
      openReimbursement: 0,
    });
    render(
      <OwedToMe reimbursements={reimbursements} expenses={[...expenses, older]} isLoading={false} />,
    );

    expect(screen.getByTestId("owed-note")).toHaveTextContent(
      "You fronted €320.00 for others this month; €140.00 is still out.",
    );
  });

  // The rows are three near-identical lines of text, so "Settle" on its own
  // would name every button on the panel the same thing to a screen reader.
  it("names each settle button by the receivable it clears", () => {
    render(<OwedToMe reimbursements={reimbursements} expenses={expenses} isLoading={false} />);

    expect(
      screen.getByRole("button", { name: "Settle Concert tickets, €100.00 open" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Settle Dinner Sat, €40.00 open" }),
    ).toBeInTheDocument();
  });

  it("puts the button inside the row it belongs to", () => {
    render(<OwedToMe reimbursements={reimbursements} expenses={expenses} isLoading={false} />);

    const rows = screen.getAllByTestId("owed-row");
    expect(within(rows[0]).getByRole("button", { name: /Concert tickets/ })).toBeInTheDocument();
    expect(within(rows[1]).getByRole("button", { name: /Dinner Sat/ })).toBeInTheDocument();
  });

  it("settles from the panel, against the right receivable and into the chosen account", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<OwedToMe reimbursements={reimbursements} expenses={expenses} isLoading={false} />);

    await user.click(screen.getByRole("button", { name: /Settle Dinner Sat/ }));

    // Same dialog the expense list opens: defaulted to the whole remainder.
    expect(await screen.findByLabelText("Paid back")).toHaveValue("40");

    await user.click(await screen.findByRole("radio", { name: "Cash Wallet" }));
    await user.click(screen.getByRole("button", { name: "Record settlement" }));

    expect(settle).toHaveBeenCalledTimes(1);
    expect(settle.mock.calls[0][0]).toMatchObject({
      id: "r1",
      settlement: { accountId: "acc-cash", amount: 40 },
    });
  });

  it("records a partial payback for less than what is open", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<OwedToMe reimbursements={reimbursements} expenses={expenses} isLoading={false} />);

    await user.click(screen.getByRole("button", { name: /Settle Concert tickets/ }));

    const amount = await screen.findByLabelText("Paid back");
    await user.clear(amount);
    await user.type(amount, "60");
    expect(screen.getByTestId("settle-remainder")).toHaveTextContent(
      "€100.00 open — €40.00 will still be out after this.",
    );

    await user.click(await screen.findByRole("radio", { name: "Visa Credit" }));
    await user.click(screen.getByRole("button", { name: "Record settlement" }));

    expect(settle.mock.calls[0][0]).toMatchObject({
      id: "r2",
      settlement: { accountId: "acc-card", amount: 60 },
    });
  });

  // Same contract the expense list has with this dialog: a rejected mutation
  // leaves it open with the entry intact so it can be corrected and retried.
  it("keeps the dialog open when the settlement is rejected", async () => {
    settle.mockRejectedValueOnce(new Error("nope"));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<OwedToMe reimbursements={reimbursements} expenses={expenses} isLoading={false} />);

    await user.click(screen.getByRole("button", { name: /Settle Dinner Sat/ }));
    await user.click(await screen.findByRole("radio", { name: "Cash Wallet" }));
    await user.click(screen.getByRole("button", { name: "Record settlement" }));

    expect(screen.getByLabelText("Paid back")).toHaveValue("40");
    expect(screen.getByRole("button", { name: "Record settlement" })).toBeInTheDocument();
  });
});
