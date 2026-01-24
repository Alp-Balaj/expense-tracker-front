import type { AmountType } from "@/Enums/enums";

export type Account = {
  id: string;
  name: string;
  type: AmountType;
  balance: number;
  currencyId: string;
  description?: string;
};

export type AccountFormData = {
  name: string;
  type: AmountType;
  balance: number;
  currencyId: string;
  description?: string;
};

export const amountTypeLabels: Record<AmountType, string> = {
  0: "Checking Account",
  1: "Savings Account",
  2: "Cash",
  3: "Credit Card",
  4: "Investment",
};

export const amountTypeIcons: Record<AmountType, string> = {
  0: "wallet",
  1: "piggy-bank",
  2: "banknote",
  3: "credit-card",
  4: "trending-up",
};
