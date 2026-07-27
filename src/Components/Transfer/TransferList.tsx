import { useMemo } from "react";
import { toast } from "sonner";

import { DataTable } from "@/Components/General/DataTable";
import ConfirmDelete from "@/Components/General/ConfirmDelete";
import TransferFormModal from "@/Components/Transfer/TransferFormModal";
import { buildTransferColumns, type Transfer } from "@/Models/Transfer";
import { useCrudDialogs } from "@/Hooks/useCrudLists";
import { getApiErrorMessage } from "@/lib/errors";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useSavingGoalsQuery } from "@/Hooks/queries/useSavingGoals";
import {
  useTransfersQuery,
  useCreateTransfer,
  useUpdateTransfer,
  useDeleteTransfer,
} from "@/Hooks/queries/useTransfers";

/** Every transfer, with the edit and delete actions the quick-log form has no room for. */
export default function TransferList() {
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
  } = useCrudDialogs<Transfer>();

  const { data: transfers = [] } = useTransfersQuery();
  const { data: accounts = [] } = useAccountsQuery();
  const { data: goals = [] } = useSavingGoalsQuery();

  const createTransfer = useCreateTransfer();
  const updateTransfer = useUpdateTransfer();
  const deleteTransfer = useDeleteTransfer();

  const submit = async (data: Transfer) => {
    try {
      if (editing) await updateTransfer.mutateAsync(data);
      else await createTransfer.mutateAsync(data);
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Saving failed."));
      throw e; // callers keep their form open
    }
    toast.success(editing ? "Changes saved" : "Transfer added");
    closeForm();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteTransfer.mutateAsync(deleting);
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Delete failed."));
      return; // keep the confirm dialog open for retry/cancel
    }
    toast.success("Deleted");
    closeModal();
  };

  const columns = useMemo(
    () =>
      buildTransferColumns({
        onEdit: (row) => startEdit(row),
        onDelete: (row) => startDelete(row),
        accounts,
        goals,
      }),
    [startEdit, startDelete, accounts, goals],
  );

  const deletingRoute = deleting
    ? `${accounts.find((a) => a.id === deleting.fromAccountId)?.name ?? "one account"} → ${
        accounts.find((a) => a.id === deleting.toAccountId)?.name ?? "another account"
      }`
    : "";

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={transfers}
        enableGlobalSearch
        searchPlaceholder="Search transfers..."
        globalSearchKeys={["note", "amount"]}
        toolbar={{
          addLabel: "New Transfer",
          onAdd: startCreate,
        }}
      />

      <TransferFormModal
        row={editing}
        onSubmit={submit}
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) closeForm();
        }}
        onCancel={closeForm}
      />

      <ConfirmDelete
        open={dialogOpen}
        close={closeModal}
        onOpenChange={setDialogOpen}
        onConfirm={confirmDelete}
        title="Delete transfer?"
        description={`Delete this ${deletingRoute} transfer? Both account balances go back to what they were.`}
      />
    </div>
  );
}
