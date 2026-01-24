export type AccountType = "checking" | "savings" | "cash" | "credit" | "investment";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currencyId: string;
  description?: string;
};

export type AccountFormData = {
  name: string;
  type: AccountType;
  balance: number;
  currencyId: string;
  description?: string;
};

export const accountTypeLabels: Record<AccountType, string> = {
  checking: "Checking Account",
  savings: "Savings Account",
  cash: "Cash",
  credit: "Credit Card",
  investment: "Investment",
};

export const accountTypeIcons: Record<AccountType, string> = {
  checking: "wallet",
  savings: "piggy-bank",
  cash: "banknote",
  credit: "credit-card",
  investment: "trending-up",
};
