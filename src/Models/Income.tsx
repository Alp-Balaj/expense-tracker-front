export type Income = {
  id: string | null;
  title: string;
  amount: number;
  date: Date;
  description: string;
  accountId: string;
  categoryId: string;
};

export type IncomeFormProps = {
  row?: Partial<Income> | null;
  onSubmit: (data: Income) => void;
  onCancel?: () => void;
};