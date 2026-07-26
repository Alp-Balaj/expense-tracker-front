import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";

type CrudMode = "create" | "update";

type UseCrudListOptions<T> = {
  endpoint: string;
  getId?: (row: T) => string;
};

type EntityWithId = { id: string | null };

export function useCrudList<T extends EntityWithId>({ endpoint }: UseCrudListOptions<T>) {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData, postData, putData, deleteData } = useAuthorizationApi();

  const [items, setItems] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const data = await getAllData<T[]>(endpoint);
      setItems(data);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) console.error(err);
    }
  }, [getAllData, endpoint]);

  useEffect(() => {
    if (!isAuthReady || !accessToken) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await getAllData<T[]>(endpoint);
        if (!cancelled) setItems(data);
      } catch (e: unknown) {
        const err = e as AxiosError;
        if (err.response?.status !== 401) console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, accessToken, getAllData, endpoint]);

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
  }

  const closeForm = () => {
    setOpen(false);
    setEditing(null);
  };

  const closeModal = () => {
    setDialogOpen(false);
    setDeleting(null);
  }

  const submit = async (data: T) => {
    const mode: CrudMode = editing ? "update" : "create";

    try {
      if (mode === "update") await putData(endpoint, data);
      else await postData(endpoint, data);
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Saving failed."));
      throw e; // callers keep their form open
    }

    toast.success(mode === "update" ? "Changes saved" : "Added");
    closeForm();
    await fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleting) return;

    try {
      await deleteData(endpoint, deleting);
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Delete failed."));
      return; // keep the confirm dialog open for retry/cancel
    }

    toast.success("Deleted");
    setDialogOpen(false);
    setDeleting(null);
    await fetchAll();
  }

  return {
    items,
    setItems,
    fetchAll,

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
    submit,
    confirmDelete
  };
}
