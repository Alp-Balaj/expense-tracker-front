import { AmountType } from "@/Enums/enums";

export type Account = {
  id: string;
  name: string;
  amountType: AmountType;
  balance: number;
  currencyId: string;
  currencyCode: string;
  description: string;
};

export type AddAccount = {
  id: string | null;
  name: string;
  amountType: AmountType;
  balance: number;
  currencyId: string;
  description: string;
};

export const AmountTypeColors: Record<
  AmountType,
  { bg: string; text: string }
> = {
  [AmountType.CheckingAccount]: {
    bg: "bg-[#2d3142]",
    text: "text-white",
  },
  [AmountType.SavingsAccount]: {
    bg: "bg-[#4a5568]",
    text: "text-white",
  },
  [AmountType.Cash]: {
    bg: "bg-primary",
    text: "text-primary-foreground",
  },
  [AmountType.CreditCard]: {
    bg: "bg-[#1a365d]",
    text: "text-white",
  },
  [AmountType.Investment]: {
    bg: "bg-[#2f5f4a]",
    text: "text-white",
  },
};

export const AccountTypeLabels: Record<AmountType, string> = {
  [AmountType.CheckingAccount]: "Checking",
  [AmountType.SavingsAccount]: "Savings",
  [AmountType.Cash]: "Cash",
  [AmountType.CreditCard]: "Credit",
  [AmountType.Investment]: "Investment",
};