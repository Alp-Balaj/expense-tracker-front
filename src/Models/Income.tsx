import type { ColumnDef } from "@tanstack/react-table"
import {
  textColumn,
  sortableColumn,
  currencyColumn,
  actionsColumn,
} from "@/Components/General/Columns"
import type { Account } from "@/Models/Account"
import type { Category } from "@/Models/Category"

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

export function buildIncomeColumns(handlers?: {
  onEdit?: (row: Income) => void
  onDelete?: (row: Income) => void
  accounts?: Account[]
  categories?: Category[]
  formatter?: (value: number) => string
}) {
  const { onEdit, onDelete, accounts = [], categories = [], formatter } = handlers ?? {}

  return [
    sortableColumn<Income>("title", "Title"),
    currencyColumn<Income>("amount", "Amount", {
      formatter,
    }),
    textColumn<Income>("date", "Date"),
    textColumn<Income>("description", "Description"),
    {
      accessorKey: "accountId",
      header: "Account",
      cell: ({ row }) => {
        const id = row.getValue("accountId") as string
        return accounts.find(a => a.id === id)?.name ?? id
      },
    } as ColumnDef<Income>,
    {
      accessorKey: "categoryId",
      header: "Category",
      cell: ({ row }) => {
        const id = row.getValue("categoryId") as string
        return categories.find(c => c.id === id)?.name ?? id
      },
    } as ColumnDef<Income>,
    actionsColumn<Income>([
      {
        label: "Copy Income ID",
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


export type IncomeFrequency = "weekly" | "biweekly" | "monthly" | "yearly"

export interface RecurringIncome {
  id: string
  name: string
  amount: number
  frequency: IncomeFrequency
  categoryId: string
  accountId: string
  nextPayDate: string
  isActive: boolean
  createdAt: string
}

export interface MonthlyIncomeSummary {
  month: string
  recurring: number
  oneTime: number
  total: number
}
