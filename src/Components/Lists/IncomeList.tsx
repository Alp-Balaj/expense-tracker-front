import { useCallback, useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";
import { useAuth } from "../../Authorization/AuthContext.js";
import IncomeForm from "../Forms/IncomeForm.js";
import type { Income } from "../../Models/Income.tsx";
import type { AxiosError } from "axios";

function IncomeList() {
    const { accessToken, isAuthReady } = useAuth();
    
    const [incomes, setIncomes] = useState<Income[]>([]);
    const { getAllData, postData, putData } = useAuthorizationApi();
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    
    const fetchIncomes = useCallback(async () => {
        try {
            const data = await getAllData<Income[]>('api/Income');
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
        fetchIncomes();
        return () => {};
    }, [fetchIncomes, isAuthReady, accessToken]);

    const addIncome = () => {
        setEditingIncome(null);
        setIsFormOpen(true);
    };

    const editIncome = (Income: Income) => {
        setEditingIncome(Income);
        setIsFormOpen(true);
    };

    const handleSubmit = async (data: Income) => {
        if (editingIncome != null) {
            console.log("UPDATE", data);
            await putData('api/Income', data);
        } else {
            console.log("CREATE", data);
            await postData('api/Income', data);
        }

        setEditingIncome(null);
        setIsFormOpen(false);
        await fetchIncomes();
    };

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Incomes</h2> <button onClick={addIncome}>Add Income</button>
            <ul>
                {incomes.map(income => (
                    <li key={income.id}>
                        {income.title} - {income.description} - {income.amount} - {income.date.toString()}
                        <button onClick={() => editIncome(income)}>Edit</button>
                    </li>
                ))}
            </ul>
            {isFormOpen && (
                <IncomeForm
                    key={editingIncome?.id ?? "new"}
                    row={editingIncome}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
}

export default IncomeList;