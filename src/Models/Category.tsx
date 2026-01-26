import type { CategoryType } from "@/Enums/enums";

export type Category = {
  id: string;
  name: string;
  description: string;
  categoryType: CategoryType;
  totalAmount: number | null | undefined;
  color: string;
};

export type AddCategory = {
  id: string | null;
  name: string;
  description: string;
  categoryType: CategoryType;
  totalAmount: number | null | undefined;
  color: string;
};

export type CategoryFormProps = {
  row?: Partial<Category> | null;
  onSubmit: (data: Category) => void;
  onCancel?: () => void;
};