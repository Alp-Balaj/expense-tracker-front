import { useMemo } from "react"
import { toast } from "sonner"
import { DataTable } from "../General/DataTable"
import IncomeFormModal from "../Income/IncomeFormModal"
import { buildIncomeColumns, type Income } from "@/Models/Income"
import { useCrudDialogs } from "@/Hooks/useCrudLists"
import ConfirmDelete from "../General/ConfirmDelete"
import { useCurrency } from "@/Hooks/useCurrency"
import { getApiErrorMessage } from "@/lib/errors"
import { useIncomesQuery, useCreateIncome, useUpdateIncome, useDeleteIncome } from "@/Hooks/queries/useIncomes"
import { useAccountsQuery } from "@/Hooks/queries/useAccounts"
import { useCategoriesQuery } from "@/Hooks/queries/useCategories"

type IncomeListProps = {
  /** The rows to show — the page's period- and filter-scoped slice.
   *  Defaults to the full history. */
  data?: Income[]
}

export default function IncomeList({ data }: IncomeListProps = {}) {
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
  } = useCrudDialogs<Income>()

  const { data: allIncomes = [] } = useIncomesQuery()
  const { data: accounts = [] } = useAccountsQuery()
  const { data: categories = [] } = useCategoriesQuery()
  const { format, userCurrencyCode } = useCurrency()

  const incomes = data ?? allIncomes

  const createIncome = useCreateIncome()
  const updateIncome = useUpdateIncome()
  const deleteIncome = useDeleteIncome()

  const submit = async (data: Income) => {
    try {
      if (editing) await updateIncome.mutateAsync(data)
      else await createIncome.mutateAsync(data)
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
      await deleteIncome.mutateAsync(deleting)
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Delete failed."))
      return // keep the confirm dialog open for retry/cancel
    }
    toast.success("Deleted")
    closeModal()
  }

  const columns = useMemo(
    () =>
      buildIncomeColumns({
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
        data={incomes}
        enableGlobalSearch
        searchPlaceholder="Search income..."
        globalSearchKeys={["title", "description", "amount"]}
        toolbar={{
          addLabel: "Add Income",
          onAdd: startCreate,
        }}
      />

      <IncomeFormModal
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
        title="Delete income?"
        description={`Delete "${deleting?.title}"? This action cannot be undone.`}
      />
    </div>
  )
}
