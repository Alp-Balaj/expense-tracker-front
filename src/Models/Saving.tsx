export type Saving = {
  id: string | null;
  amount: number;
  date: Date;
  accountId: string;
  categoryId: string;
  description: string;
};

export type SavingFormProps = {
  row?: Partial<Saving> | null;
  onSubmit: (data: Saving) => void;
  onCancel?: () => void;
};