import { useCallback, useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi";
import { useAuth } from "../../Authorization/AuthContext";
import FutureExpenseForm from "../Forms/FutureExpenseForm";
import type { FutureExpense } from "../../Models/FutureExpense";
import type { AxiosError } from "axios";
import { Button } from "../ui/button";
import { formatDate } from "@/lib/dates";

function FutureExpenseList() {
  const { accessToken, isAuthReady } = useAuth();

  const [futureExpense, setFutureExpense] = useState<FutureExpense[]>([]);
  const { getAllData, postData, putData } = useAuthorizationApi();
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingFutureExpense, setEditingFutureExpense] = useState<FutureExpense | null>(null);
    
    const fetchFutureExpense = useCallback(async () => {
        try {
            const data = await getAllData<FutureExpense[]>('api/FutureExpense');
            setFutureExpense(data);
        } catch (e: unknown) {
            const err = e as AxiosError;
            if (err.response?.status !== 401) {
            console.error(err);
            }
        }
    }, [getAllData]);
    
    useEffect(() => {
        if (!isAuthReady || !accessToken) return;
        fetchFutureExpense();
    }, [fetchFutureExpense, isAuthReady, accessToken]);

    const addFutureExpense = () => {
        setEditingFutureExpense(null);
        setIsFormOpen(true);
    };

    const editFutureExpense = (futureExpense: FutureExpense) => {
        setEditingFutureExpense(futureExpense);
        setIsFormOpen(true);
    };

    const handleSubmit = async (data: FutureExpense) => {
        if (editingFutureExpense != null) {
            await putData('api/FutureExpense', data);
        } else {
            await postData('api/FutureExpense', data);
        }

        setEditingFutureExpense(null);
        setIsFormOpen(false);
        await fetchFutureExpense();
    };

    return (
        <div className="bg-white">
            <h2>Future Expenses</h2> <Button onClick={addFutureExpense}>Add Future Expense</Button>
            <ul>
                {Array.isArray(futureExpense) && futureExpense.map(futureExpense => (
                    <li key={futureExpense.id}>
                        {futureExpense.title} - {futureExpense.amount} - {formatDate(futureExpense.date)} - {futureExpense.categoryId} - {futureExpense.description}
                        <Button onClick={() => editFutureExpense(futureExpense)}>Edit</Button>
                    </li>
                ))}
            </ul>
            {isFormOpen && (
                <FutureExpenseForm
                    key={editingFutureExpense?.id ?? "new"}
                    row={editingFutureExpense}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsFormOpen(false)}
                    open={isFormOpen}
                />
            )}
        </div>  
    );
}

export default FutureExpenseList;