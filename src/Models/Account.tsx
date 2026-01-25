import type { AmountType } from "@/Enums/enums";

export type Account = {
  id?: string;
  name: string;
  amountType: AmountType;
  balance: number;
  balanceCurrencyId: string;
  description?: string;
};

export type AccountFormData = {
  name: string;
  amountType: AmountType;
  balance: number;
  balanceCurrencyId: string;
  description?: string;
};