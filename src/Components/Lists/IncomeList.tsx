import { DataTable } from "../General/DataTable";
// import IncomeForm from "../Forms/IncomeForm";
import { incomeColumns, type Income } from "@/Models/Income";
import { useCrudList } from "@/Hooks/useCrudLists";

export default function IncomeList() {
  const {
    items: incomes,
    open: isFormOpen,
    editing: editingIncome,
    startCreate,
    startEdit,
    closeForm,
    submit,
  } = useCrudList<Income>({ endpoint: "api/Income" });

  return (
    <div className="space-y-4">
      <DataTable
        columns={incomeColumns({ onEdit: startEdit })} // see next section
        data={incomes}
        enableGlobalSearch
        searchPlaceholder="Search income..."
        globalSearchKeys={["title", "description", "amount"]}
        toolbar={{
          addLabel: "Add Income",
          onAdd: startCreate,
        }}
      />

      {/* <IncomeForm
        row={editingIncome}
        open={isFormOpen}
        onSubmit={submit}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
        onCancel={closeForm}
      /> */}
    </div>
  );
}