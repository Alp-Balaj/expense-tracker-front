import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CommitOccurrenceDialog from "@/Components/Planned/CommitOccurrenceDialog";
import * as accountHooks from "@/Hooks/queries/useAccounts";
import { AmountType, PlannedKind, PlannedOccurrenceState } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { PlannedOccurrence } from "@/Models/PlannedTransaction";

// Nothing in this feature posts unattended, so this dialog is the only place a
// planned transaction becomes money. What it pre-fills, and what it refuses to
// submit, is the whole safety story.

vi.mock("@/Hooks/queries/useAccounts");

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
    name: "Cash",
    amountType: AmountType.Cash,
    balance: 200,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
];

function occurrence(overrides: Partial<PlannedOccurrence> = {}): PlannedOccurrence {
  return {
    id: "occ-1",
    plannedTransactionId: "t-1",
    periodKey: "2026-07",
    dueDate: "2026-07-01",
    state: PlannedOccurrenceState.Pending,
    committedAt: null,
    expenseId: null,
    incomeId: null,
    transferId: null,
    title: "Rent",
    description: null,
    kind: PlannedKind.Expense,
    amount: 800,
    categoryId: "cat-housing",
    fromAccountId: "acc-checking",
    toAccountId: null,
    savingGoalId: null,
    ...overrides,
  };
}

function renderDialog(
  row: PlannedOccurrence | null,
  onSubmit = vi.fn().mockResolvedValue(undefined),
) {
  render(
    <CommitOccurrenceDialog
      occurrence={row}
      open={row !== null}
      onOpenChange={() => {}}
      onSubmit={onSubmit}
    />,
  );
  return onSubmit;
}

// jsdom has no matchMedia; FormShell's useIsMobile needs one to pick a layout.
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
  vi.mocked(accountHooks).useAccountsQuery.mockReturnValue({
    data: accounts,
    isLoading: false,
  } as never);
});

describe("CommitOccurrenceDialog", () => {
  it("pre-fills the expected amount and the due date so the ordinary case is one click", async () => {
    const onSubmit = renderDialog(occurrence());

    expect(screen.getByLabelText("Amount")).toHaveValue("800");
    expect(screen.getByRole("radio", { name: /jul 1, 2026/i })).toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onSubmit).toHaveBeenCalledWith("occ-1", {
      amount: 800,
      date: "2026-07-01",
      updateTemplateAmount: false,
      fromAccountId: "acc-checking",
    });
  });

  it("submits the corrected date, because the money rarely moves on the day it was due", async () => {
    const onSubmit = renderDialog(occurrence());

    await userEvent.click(screen.getByRole("radio", { name: /jul 1, 2026/i }));
    await userEvent.click(await screen.findByRole("button", { name: /july 3rd/i }));

    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      "occ-1",
      expect.objectContaining({ date: "2026-07-03" }),
    );
  });

  it("only offers to update the template once the amount actually changes", async () => {
    renderDialog(occurrence());

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

    const amount = screen.getByLabelText("Amount");
    await userEvent.clear(amount);
    await userEvent.type(amount, "95");

    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("leaves the template's amount alone unless asked", async () => {
    const onSubmit = renderDialog(occurrence());

    const amount = screen.getByLabelText("Amount");
    await userEvent.clear(amount);
    await userEvent.type(amount, "95");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    // One expensive month must not silently redefine what this costs.
    expect(onSubmit).toHaveBeenCalledWith(
      "occ-1",
      expect.objectContaining({ amount: 95, updateTemplateAmount: false }),
    );
  });

  it("carries the checkbox through when the user does ask", async () => {
    const onSubmit = renderDialog(occurrence());

    const amount = screen.getByLabelText("Amount");
    await userEvent.clear(amount);
    await userEvent.type(amount, "95");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      "occ-1",
      expect.objectContaining({ amount: 95, updateTemplateAmount: true }),
    );
  });

  it("cannot be confirmed without an account, rather than guessing one", async () => {
    // A bill sometimes paid in cash has no default, so this is the state the
    // phone-bill case lands in every month.
    renderDialog(occurrence({ fromAccountId: null }));

    expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
  });

  it("asks for both accounts on a transfer and refuses the same one twice", async () => {
    renderDialog(
      occurrence({
        kind: PlannedKind.Transfer,
        title: "Monthly savings",
        fromAccountId: "acc-checking",
        toAccountId: "acc-checking",
        categoryId: null,
      }),
    );

    expect(screen.getByLabelText("From account")).toBeInTheDocument();
    expect(screen.getByLabelText("To account")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("two different accounts");
    expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
  });

  it("asks where income landed rather than where it came from", () => {
    renderDialog(
      occurrence({
        kind: PlannedKind.Income,
        title: "Salary",
        fromAccountId: null,
        toAccountId: "acc-checking",
      }),
    );

    expect(screen.getByLabelText("Paid into")).toBeInTheDocument();
    expect(screen.queryByLabelText("Paid from")).not.toBeInTheDocument();
  });
});
