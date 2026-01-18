export type Category = {
  id: string | null;
  name: string;
  description: string;
  categoryTypeId: string;
  color: string;
};

export type CategoryFormProps = {
  row?: Partial<Category> | null;
  onSubmit: (data: Category) => void;
  onCancel?: () => void;
};