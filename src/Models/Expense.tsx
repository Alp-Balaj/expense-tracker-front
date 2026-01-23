import {
  textColumn,
  sortableColumn,
  currencyColumn,
  actionsColumn,
} from "@/Components/General/Columns"

export type Expense = {
  id: string | null;
  title: string;
  amount: number;
  date: Date;
  description: string;
  accountId: string;
  categoryId: string;
};

export type ExpenseFormProps = {
  row?: Partial<Expense> | null;
  onSubmit: (data: Expense) => void;
  onCancel?: () => void;
};

export const expenseColumns = [
  sortableColumn<Expense>("title", "Title"),
  currencyColumn<Expense>("amount", "Amount", {
    locale: "de-DE",
    currency: "EUR",
  }),
  textColumn<Expense>("date", "Date"),
  textColumn<Expense>("description", "Description"),
  textColumn<Expense>("accountId", "Account"),
  textColumn<Expense>("categoryId", "Category"),
  actionsColumn<Expense>([
    {
      label: "Copy Expense ID",
      onClick: (e) =>
        navigator.clipboard.writeText(e.id ?? ""),
    },
    {
      label: "View details",
      onClick: (e) => console.log(e),
    },
  ]),
]