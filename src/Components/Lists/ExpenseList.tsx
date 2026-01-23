import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import { expenseColumns, type Expense } from "@/Models/Expense";
import type { AxiosError } from "axios";
import ExpenseForm from "../Forms/ExpenseForm";
import { DataTable } from "../General/DataTable";

export default function ExpenseList() {
  const { accessToken, isAuthReady } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { getAllData, postData, putData } = useAuthorizationApi();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await getAllData<Expense[]>("api/Expense");
      setExpenses(data);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        console.error(err);
      }
    }
  }, [getAllData]);

  useEffect(() => {
    if (!isAuthReady || !accessToken) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await getAllData<Expense[]>("api/Expense");
        if (!cancelled) setExpenses(data);
      } catch (e: unknown) {
        const err = e as AxiosError;
        if (err.response?.status !== 401) console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, accessToken, getAllData]);

  const handleSubmit = async (data: Expense) => {
    if (editingExpense != null) {
      await putData("api/Expense", data);
    } else {
      await postData("api/Expense", data);
    }

    setEditingExpense(null);
    setIsFormOpen(false);
    await fetchExpenses();
  };

  return (
    <div className="space-y-4">
      <DataTable
        columns={expenseColumns}
        data={expenses}
        enableGlobalSearch
        searchPlaceholder="Search expenses..."
        globalSearchKeys={["title", "description", "amount"]}
        toolbar={{
          addLabel: "Add Expense",
          onAdd: () => setIsFormOpen(true),
        }}
      />

      <ExpenseForm
        row={editingExpense}
        onSubmit={handleSubmit}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingExpense(null);
        }}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingExpense(null);
        }}
      />
    </div>
  );
}