import { useMemo } from "react"
import { DataTable } from "../General/DataTable"
import IncomeFormModal from "../Income/IncomeFormModal"
import { buildIncomeColumns, type Income } from "@/Models/Income"
import { useCrudList } from "@/Hooks/useCrudLists"
import ConfirmDelete from "../General/ConfirmDelete"

export default function IncomeList() {
  const {
    items: incomes,
    open,
    dialogOpen,
    setOpen,
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
  } = useCrudList<Income>({ endpoint: "api/Income" })

  const columns = useMemo(
    () =>
      buildIncomeColumns({
        onEdit: (row) => startEdit(row),
        onDelete: (row) => startDelete(row),
      }),
    [startEdit]
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
