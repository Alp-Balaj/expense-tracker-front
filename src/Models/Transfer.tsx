import type { ColumnDef } from "@tanstack/react-table"
import { ArrowRight } from "lucide-react"

import { dateColumn, sortableColumn, actionsColumn } from "@/Components/General/Columns"
import { ConvertedAmount } from "@/Components/General/ConvertedAmount"
import type { Account } from "@/Models/Account"
import type { SavingGoals } from "@/Models/SavingGoals"

/**
 * Money moved between two of the user's own accounts. Deliberately not an
 * expense plus an income: transfers live in their own table so they never
 * reach the income/expense totals.
 */
export type Transfer = {
  id: string | null;
  amount: number;
  date: string;
  note: string | null;
  fromAccountId: string;
  toAccountId: string;
  /** Optional savings goal this transfer counts toward. */
  savingGoalId: string | null;
  /** Server-owned: the contribution the backend booked. Never sent back. */
  savingContributionId?: string | null;
};

/** A blank transfer, dated today, for the create form. */
export function emptyTransfer(date: string): Transfer {
  return {
    id: null,
    amount: 0,
    date,
    note: "",
    fromAccountId: "",
    toAccountId: "",
    savingGoalId: null,
  };
}

export function buildTransferColumns(handlers?: {
  onEdit?: (row: Transfer) => void
  onDelete?: (row: Transfer) => void
  accounts?: Account[]
  goals?: SavingGoals[]
}) {
  const { onEdit, onDelete, accounts = [], goals = [] } = handlers ?? {}

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id

  return [
    dateColumn<Transfer>("date", "Date"),
    {
      id: "route",
      header: "From → To",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span>{accountName(row.original.fromAccountId)}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span>{accountName(row.original.toAccountId)}</span>
        </div>
      ),
    } as ColumnDef<Transfer>,
    {
      ...sortableColumn<Transfer>("amount", "Amount"),
      // Both accounts share a currency by construction, so the source
      // account's code describes the whole move.
      cell: ({ row }) => {
        const code = accounts.find((a) => a.id === row.original.fromAccountId)?.currencyCode ?? ""
        return (
          <div className="text-left font-medium">
            <ConvertedAmount amount={row.original.amount} fromCode={code} />
          </div>
        )
      },
    } as ColumnDef<Transfer>,
    {
      id: "savingGoalId",
      header: "Savings goal",
      cell: ({ row }) => {
        const id = row.original.savingGoalId
        if (!id) return <span className="text-muted-foreground">—</span>
        return goals.find((g) => g.id === id)?.title ?? id
      },
    } as ColumnDef<Transfer>,
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ row }) => row.original.note || <span className="text-muted-foreground">—</span>,
    } as ColumnDef<Transfer>,
    actionsColumn<Transfer>([
      {
        label: "Copy Transfer ID",
        onClick: (t) => navigator.clipboard.writeText(t.id ?? ""),
      },
      {
        label: "Edit",
        onClick: (t) => onEdit?.(t),
      },
      {
        label: "Delete",
        onClick: (t) => onDelete?.(t),
      },
    ]),
  ]
}
