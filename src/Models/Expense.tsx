import type { ColumnDef } from "@tanstack/react-table"
import {
  textColumn,
  sortableColumn,
  currencyColumn,
  actionsColumn,
} from "@/Components/General/Columns"
import type { Account } from "@/Models/Account"
import type { Category } from "@/Models/Category"

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
  accounts?: Account[]
  categories?: Category[]
  formatter?: (value: number) => string
}) {
  const { onEdit, onDelete, accounts = [], categories = [], formatter } = handlers ?? {}

  return [
    sortableColumn<Expense>("title", "Title"),
    currencyColumn<Expense>("amount", "Amount", {
      formatter,
    }),
    textColumn<Expense>("date", "Date"),
    textColumn<Expense>("description", "Description"),
    {
      accessorKey: "accountId",
      header: "Account",
      cell: ({ row }) => {
        const id = row.getValue("accountId") as string
        return accounts.find(a => a.id === id)?.name ?? id
      },
    } as ColumnDef<Expense>,
    {
      accessorKey: "categoryId",
      header: "Category",
      cell: ({ row }) => {
        const id = row.getValue("categoryId") as string
        return categories.find(c => c.id === id)?.name ?? id
      },
    } as ColumnDef<Expense>,
    actionsColumn<Expense>([
      {
        label: "Copy Expense ID",
        onClick: (e) => navigator.clipboard.writeText(e.id ?? ""),
      },
      {
        label: "Edit",
        onClick: (e) => onEdit?.(e),
      },
      {
        label: "Delete",
        onClick: (e) => onDelete?.(e),
      },
    ]),
  ]
}

