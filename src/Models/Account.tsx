export type Account = {
  id: string | null;
  name: string;
  amountTypeId: string;
  balance: number;
  balanceCurrencyId: string;
};

export type AccountFormProps = {
  row?: Partial<Account> | null;
  onSubmit: (data: Account) => void;
  onCancel?: () => void;
};