import { DataTable } from "../General/DataTable";
import IncomeForm from "../Forms/IncomeForm";
import { incomeColumns, type Income } from "@/Models/Income";
import { useAuth } from "@/Authorization/AuthContext";
import { useCallback, useEffect, useState } from "react";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import type { AxiosError } from "axios";

export default function IncomeList() {
  const { accessToken, isAuthReady } = useAuth();
  
  const [incomes, setIncomes] = useState<Income[]>([]);
  const { getAllData, postData, putData } = useAuthorizationApi();
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const fetchIncome = useCallback(async () => {
    try {
      const data = await getAllData<Income[]>("api/Income");
      setIncomes(data);
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
        const data = await getAllData<Income[]>("api/Income");
        if (!cancelled) setIncomes(data);
      } catch (e: unknown) {
        const err = e as AxiosError;
        if (err.response?.status !== 401) console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, accessToken, getAllData]);

  const handleSubmit = async (data: Income) => {
    if (editingIncome != null) {
      await putData("api/Income", data);
    } else {
      await postData("api/Income", data);
    }

    setEditingIncome(null);
    setIsFormOpen(false);
    await fetchIncome();
  };

  return (
    <div className="space-y-4">
      <DataTable
        columns={incomeColumns}
        data={incomes}
        enableGlobalSearch
        searchPlaceholder="Search income..."
        globalSearchKeys={["title", "description", "amount"]}
        toolbar={{
          addLabel: "Add Income",
          onAdd: () => setIsFormOpen(true),
        }}
      />

      <IncomeForm
        row={editingIncome}
        onSubmit={handleSubmit}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingIncome(null);
        }}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingIncome(null);
        }}
      />
    </div>
  );
}