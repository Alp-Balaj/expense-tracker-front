import type { AmountType } from "@/Enums/enums";

export type Account = {
  id: string | null;
  name: string;
  amountType: AmountType;
  balance: number;
  balanceCurrencyId: string;
  description: string;
};

export type AccountFormData = {
  id: string | null;
  name: string;
  amountType: AmountType;
  balance: number;
  balanceCurrencyId: string;
  description: string;
};