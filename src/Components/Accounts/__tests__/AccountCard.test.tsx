import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AccountCard } from "@/Components/Accounts/AccountCard";
import { AmountType } from "@/Enums/enums";
import type { Account } from "@/Models/Account";

// Savings goals are envelopes: they reserve against a real account without
// moving anything, so the card has to show what is left to spend rather than
// what the bank says. Two rules shape every case below — the card must be
// untouched for the many users with no goals at all, and an account reserved
// past its balance must say so quietly instead of reading as an error.

vi.mock("@/Hooks/useCurrency", () => ({
  useCurrency: () => ({
    userCurrencyCode: "EUR",
    currenciesMap: {},
    convert: (amount: number) => amount,
    format: (amount: number) => `€${amount.toFixed(2)}`,
    formatOriginal: (amount: number) => `€${amount.toFixed(2)}`,
  }),
}));

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: "acc-1",
    name: "Main Checking",
    amountType: AmountType.CheckingAccount,
    balance: 500,
    reservedAmount: 0,
    currencyId: "cur-eur",
    currencyCode: "EUR",
    description: "",
    ...overrides,
  };
}

describe("AccountCard with savings envelopes", () => {
  it("looks exactly as it always did when nothing is reserved", () => {
    render(<AccountCard account={account()} />);

    expect(screen.getByText("€500.00")).toBeInTheDocument();
    expect(screen.getByText("Available balance")).toBeInTheDocument();
    // Not merely empty — absent, so the card gains no height for a feature the
    // user is not using.
    expect(screen.queryByTestId("account-reserved")).not.toBeInTheDocument();
    expect(screen.queryByTestId("account-underfunded")).not.toBeInTheDocument();
  });

  it("leads with usable money and names what the goals hold back", () => {
    render(<AccountCard account={account({ balance: 500, reservedAmount: 100 })} />);

    expect(screen.getByText("€400.00")).toBeInTheDocument();
    expect(screen.getByTestId("account-reserved")).toHaveTextContent("€100.00 reserved by goals");
    expect(screen.queryByTestId("account-underfunded")).not.toBeInTheDocument();
  });

  it("warns about the shortfall when goals reserve more than the account holds", () => {
    render(<AccountCard account={account({ balance: 300, reservedAmount: 400 })} />);

    expect(screen.getByTestId("account-underfunded")).toHaveTextContent(
      "€100.00 short of what goals reserved",
    );
  });

  it("shows the usable figure going negative rather than pretending it is zero", () => {
    render(<AccountCard account={account({ balance: 300, reservedAmount: 400 })} />);

    expect(screen.getByText("€-100.00")).toBeInTheDocument();
  });

  it("says nothing about a shortfall for an account reserved exactly to the penny", () => {
    render(<AccountCard account={account({ balance: 400, reservedAmount: 400 })} />);

    expect(screen.getByTestId("account-reserved")).toHaveTextContent("€400.00 reserved by goals");
    expect(screen.queryByTestId("account-underfunded")).not.toBeInTheDocument();
  });
});
