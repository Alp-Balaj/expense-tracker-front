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

export function buildExpenseColumns(handlers?: {
  onEdit?: (row: Expense) => void
  onDelete?: (row: Expense) => void
}) {
  return [
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
        onClick: (e) => navigator.clipboard.writeText(e.id ?? ""),
      },
      {
        label: "Edit",
        onClick: (e) => handlers?.onEdit?.(e),
      },
      {
        label: "Delete",
        onClick: (e) => handlers?.onDelete?.(e),
      },
    ]),
  ]
}

/** @deprecated Use buildExpenseColumns() for action wiring */
export const expenseColumns = buildExpenseColumns()