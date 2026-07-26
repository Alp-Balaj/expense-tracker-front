import { useMemo } from "react"
import { toast } from "sonner"
import { DataTable } from "../General/DataTable"
import ExpenseForm from "../Forms/ExpenseForm"
import { buildExpenseColumns, type Expense } from "@/Models/Expense"
import { useCrudDialogs } from "@/Hooks/useCrudLists"
import ConfirmDelete from "../General/ConfirmDelete"
import { useCurrency } from "@/Hooks/useCurrency"
import { getApiErrorMessage } from "@/lib/errors"
import { useExpensesQuery, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/Hooks/queries/useExpenses"
import { useAccountsQuery } from "@/Hooks/queries/useAccounts"
import { useCategoriesQuery } from "@/Hooks/queries/useCategories"

export default function ExpenseList() {
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

  const { data: expenses = [] } = useExpensesQuery()
  const { data: accounts = [] } = useAccountsQuery()
  const { data: categories = [] } = useCategoriesQuery()
  const { format, userCurrencyCode } = useCurrency()

  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

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

  const columns = useMemo(
    () =>
      buildExpenseColumns({
        onEdit: (row) => startEdit(row),
        onDelete: (row) => startDelete(row),
        accounts,
        categories,
        formatter: (value) => format(value, userCurrencyCode),
      }),
    [startEdit, startDelete, accounts, categories, format, userCurrencyCode]
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
