import {
  textColumn,
  sortableColumn,
  currencyColumn,
  actionsColumn,
} from "@/Components/General/Columns"

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
}) {
  return [
    sortableColumn<Income>("title", "Title"),
    currencyColumn<Income>("amount", "Amount", {
      locale: "de-DE",
      currency: "EUR",
    }),
    textColumn<Income>("date", "Date"),
    textColumn<Income>("description", "Description"),
    textColumn<Income>("accountId", "Account"),
    textColumn<Income>("categoryId", "Category"),
    actionsColumn<Income>([
      {
        label: "Copy Income ID",
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

/** @deprecated Use buildIncomeColumns() for action wiring */
export const incomeColumns = buildIncomeColumns()

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
