import { useMemo, useState } from "react"
import { toast } from "sonner"
import { DataTable } from "../General/DataTable"
import ExpenseForm from "../Forms/ExpenseForm"
import SettleReimbursementDialog from "../Reimbursements/SettleReimbursementDialog"
import { buildExpenseColumns, type Expense } from "@/Models/Expense"
import type { Reimbursement, SettleReimbursement } from "@/Models/Reimbursement"
import { useCrudDialogs } from "@/Hooks/useCrudLists"
import ConfirmDelete from "../General/ConfirmDelete"
import { useCurrency } from "@/Hooks/useCurrency"
import { getApiErrorMessage } from "@/lib/errors"
import { useExpensesQuery, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/Hooks/queries/useExpenses"
import { useReimbursementsQuery, useSettleReimbursement } from "@/Hooks/queries/useReimbursements"
import { useAccountsQuery } from "@/Hooks/queries/useAccounts"
import { useCategoriesQuery } from "@/Hooks/queries/useCategories"

type ExpenseListProps = {
  /** The rows to show — the page's period- and filter-scoped slice.
   *  Defaults to the full history. */
  data?: Expense[]
}

export default function ExpenseList({ data }: ExpenseListProps = {}) {
  const {
    open,
    setOpen,
    dialogOpen,
    setDialogOpen,
    editing,
    deleting,
    startCreate,
    startEdit,
    startDelete,
    closeForm,
    closeModal,
  } = useCrudDialogs<Expense>()

  const { data: allExpenses = [] } = useExpensesQuery()
  const { data: accounts = [] } = useAccountsQuery()
  const { data: categories = [] } = useCategoriesQuery()
  const { data: reimbursements = [] } = useReimbursementsQuery()
  const { format, userCurrencyCode } = useCurrency()

  const expenses = data ?? allExpenses

  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  // The row knows what is still owed on it, but only the receivable knows its
  // own id — which is what a settlement is posted against.
  const [settling, setSettling] = useState<Reimbursement | null>(null)
  const settleReimbursement = useSettleReimbursement()

  const receivableByExpense = useMemo(
    () => new Map(reimbursements.map((r) => [r.expenseId, r])),
    [reimbursements]
  )

  const submit = async (data: Expense) => {
    try {
      if (editing) await updateExpense.mutateAsync(data)
      else await createExpense.mutateAsync(data)
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Saving failed."))
      throw e // callers keep their form open
    }
    toast.success(editing ? "Changes saved" : "Added")
    closeForm()
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteExpense.mutateAsync(deleting)
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Delete failed."))
      return // keep the confirm dialog open for retry/cancel
    }
    toast.success("Deleted")
    closeModal()
  }

  const submitSettle = async (id: string, settlement: SettleReimbursement) => {
    try {
      await settleReimbursement.mutateAsync({ id, settlement })
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Settling failed."))
      throw e // keeps the dialog open so the user can correct it
    }
    toast.success("Settlement recorded")
    setSettling(null)
  }

  const columns = useMemo(
    () =>
      buildExpenseColumns({
        onEdit: (row) => startEdit(row),
        onDelete: (row) => startDelete(row),
        onSettle: (row) => {
          const receivable = row.id ? receivableByExpense.get(row.id) : undefined
          if (!receivable) {
            toast.error("Nothing left to settle on this expense.")
            return
          }
          setSettling(receivable)
        },
        accounts,
        categories,
        formatter: (value) => format(value, userCurrencyCode),
      }),
    [startEdit, startDelete, receivableByExpense, accounts, categories, format, userCurrencyCode]
  )

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={expenses}
        enableGlobalSearch
        searchPlaceholder="Search expenses..."
        globalSearchKeys={["title", "description", "amount"]}
        toolbar={{
          addLabel: "Add Expense",
          onAdd: startCreate,
        }}
      />

      <ExpenseForm
        row={editing}
        onSubmit={submit}
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) closeForm()
        }}
        onCancel={closeForm}
      />

      <SettleReimbursementDialog
        reimbursement={settling}
        open={settling !== null}
        onOpenChange={(isOpen) => !isOpen && setSettling(null)}
        onSubmit={submitSettle}
      />

      <ConfirmDelete
        open={dialogOpen}
        close={closeModal}
        onOpenChange={setDialogOpen}
        onConfirm={confirmDelete}
        title="Delete expense?"
        description={`Delete "${deleting?.title}"? This action cannot be undone.`}
      />
    </div>
  )
}
