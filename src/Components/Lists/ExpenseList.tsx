import { useMemo } from "react"
import { DataTable } from "../General/DataTable"
import ExpenseForm from "../Forms/ExpenseForm"
import { buildExpenseColumns, type Expense } from "@/Models/Expense"
import { useCrudList } from "@/Hooks/useCrudLists"
import ConfirmDelete from "../General/ConfirmDelete"

export default function ExpenseList() {
  const {
    items: expenses,
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
    submit,
    confirmDelete
  } = useCrudList<Expense>({ endpoint: "api/Expense" })

  const columns = useMemo(
    () =>
      buildExpenseColumns({
        onEdit: (row) => startEdit(row),
        onDelete: (row) => startDelete(row)
      }),
    [startEdit]
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
        title="Delete income?"
        description={`Delete "${deleting?.title}"? This action cannot be undone.`}
      />
    </div>
  )
}