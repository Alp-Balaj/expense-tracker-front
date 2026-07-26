export type FutureExpense = {
  id: string | null;
  title: string;
  amount: number;
  date: string;
  categoryId: string;
  description: string;
};

export type FutureExpenseFormProps = {
  row?: Partial<FutureExpense> | null;
  onSubmit: (data: FutureExpense) => void;
  onCancel?: () => void;
  open: boolean;
};
