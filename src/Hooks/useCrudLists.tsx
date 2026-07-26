import { useState } from "react";

type EntityWithId = { id: string | null };

// Dialog/editing-state plumbing shared by list pages backed by a React Query
// resource hook. Fetching and mutating now live in Hooks/queries/*; this
// hook only tracks which row is being created/edited/deleted and which
// dialogs are open.
export function useCrudDialogs<T extends EntityWithId>() {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const startCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const startEdit = (row: T) => {
    setEditing(row);
    setOpen(true);
  };

  const startDelete = (row: T) => {
    setDeleting(row);
    setDialogOpen(true);
  };

  const closeForm = () => {
    setOpen(false);
    setEditing(null);
  };

  const closeModal = () => {
    setDialogOpen(false);
    setDeleting(null);
  };

  return {
    open,
    setOpen,
    dialogOpen,
    setDialogOpen,
    editing,
    setEditing,
    deleting,
    setDeleting,

    startCreate,
    startEdit,
    startDelete,
    closeForm,
    closeModal,
  };
}
