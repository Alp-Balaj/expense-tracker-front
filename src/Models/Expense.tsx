import type { ColumnDef } from "@tanstack/react-table"
import {
  textColumn,
  dateColumn,
  sortableColumn,
  currencyColumn,
  actionsColumn,
} from "@/Components/General/Columns"
import type { Account } from "@/Models/Account"
import type { Category } from "@/Models/Category"
import { openReceivable } from "@/lib/dashboard"

export type Expense = {
  id: string | null;
  title: string;
  amount: number;
  date: string;
  description: string;
  accountId: string;
  categoryId: string;
  /**
   * Stream O: this row is in the offline outbox and the server has not accepted
   * it yet. Present only on optimistic rows the outbox put in the cache; a row
   * that came from the server never carries it.
   *
   * Marked rather than left indistinguishable on purpose — an unmarked
   * provisional row is a lie about money, and the one that fails permanently
   * would sit in the list looking saved for ever.
   */
  pending?: boolean;
  /** What others owe you on this expense. null/absent = not a split bill. */
  expectedReimbursement?: number | null;
  /** server-owned, response only */
  settledReimbursement?: number;
  openReimbursement?: number;
};

export type ExpenseFormProps = {
  row?: Partial<Expense> | null;
  onSubmit: (data: Expense) => void;
  onCancel?: () => void;
};

export function buildExpenseColumns(handlers?: {
  onEdit?: (row: Expense) => void
  onDelete?: (row: Expense) => void
  /** Offered only on rows that still have something owed on them. */
  onSettle?: (row: Expense) => void
  accounts?: Account[]
  categories?: Category[]
  formatter?: (value: number) => string
}) {
  const { onEdit, onDelete, onSettle, accounts = [], categories = [], formatter } = handlers ?? {}

  const money = (value: number) => (formatter ? formatter(value) : value.toFixed(2))

  return [
    {
      ...sortableColumn<Expense>("title", "Title"),
      cell: ({ row }) => {
        // The amount column shows the gross, because gross is what left the
        // account. This says the rest of the story: part of that 60 is coming
        // back. Quiet on purpose — it is a note, not a warning.
        const open = openReceivable(row.original)
        return (
          <span className="inline-flex items-center gap-2">
            {row.original.title}
            {row.original.pending && (
              <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                waiting
              </span>
            )}
            {open > 0 && (
              <span
                data-testid="owed-badge"
                title={`${money(open)} owed to you on this expense`}
                className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
              >
                owed {money(open)}
              </span>
            )}
          </span>
        )
      },
    } as ColumnDef<Expense>,
    currencyColumn<Expense>("amount", "Amount", {
      formatter,
    }),
    dateColumn<Expense>("date", "Date"),
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
      // Recording a payback is only ever meaningful on a row that still has one
      // outstanding, so the entry is absent rather than disabled everywhere else.
      {
        label: "Settle",
        onClick: (e) => onSettle?.(e),
        visible: (e) => Boolean(onSettle) && openReceivable(e) > 0,
      },
      {
        label: "Delete",
        onClick: (e) => onDelete?.(e),
      },
    ]),
  ]
}

