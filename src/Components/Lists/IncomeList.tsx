import { useMemo } from "react"
import { DataTable } from "../General/DataTable"
import IncomeFormModal from "../Income/IncomeFormModal"
import { buildIncomeColumns, type Income } from "@/Models/Income"
import { useCrudList } from "@/Hooks/useCrudLists"

export default function IncomeList() {
  const {
    items: incomes,
    open,
    setOpen,
    editing,
    startCreate,
    startEdit,
    closeForm,
    submit,
  } = useCrudList<Income>({ endpoint: "api/Income" })

  const columns = useMemo(
    () =>
      buildIncomeColumns({
        onEdit: (row) => startEdit(row),
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
    </div>
  )
}
