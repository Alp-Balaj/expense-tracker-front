import { useCallback, useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";
import { useAuth } from "../../Authorization/AuthContext.js";
import FutureExpenseForm from "../Forms/FutureExpenseForm.js";
import type { FutureExpense } from "../../Models/FutureExpense.tsx";
import type { AxiosError } from "axios";

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
        return () => {};
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
            console.log("UPDATE", data);
            await putData('api/FutureExpense', data);
        } else {
            console.log("CREATE", data);
            await postData('api/FutureExpense', data);
        }

        setEditingFutureExpense(null);
        setIsFormOpen(false);
        await fetchFutureExpense();
    };

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Future Expenses</h2> <button onClick={addFutureExpense}>Add Future Expense</button>
            <ul>
                {futureExpense.map(futureExpense => (
                    <li key={futureExpense.id}>
                        {futureExpense.title} - {futureExpense.amount} - {futureExpense.date.toString()} - {futureExpense.categoryId} - {futureExpense.description}
                        <button onClick={() => editFutureExpense(futureExpense)}>Edit</button>
                    </li>
                ))}
            </ul>
            {isFormOpen && (
                <FutureExpenseForm
                    key={editingFutureExpense?.id ?? "new"}
                    row={editingFutureExpense}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}
        </div>  
    );
}

export default FutureExpenseList;