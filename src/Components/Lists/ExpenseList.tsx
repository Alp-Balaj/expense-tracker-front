import { useCallback, useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";
import { useAuth } from "../../Authorization/AuthContext.js";
import ExpenseForm from "../Forms/ExpenseForm.js";
import { expenseColumns, type Expense } from "../../Models/Expense.tsx";
import type { AxiosError } from "axios";
import { Button } from "../ui/button.tsx";
import { DataTable } from "../General/DataTable.tsx";

function ExpenseList() {
    const { accessToken, isAuthReady } = useAuth();
    
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const { getAllData, postData, putData } = useAuthorizationApi();
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    
    const fetchExpenses = useCallback(async () => {
        try {
            const data = await getAllData<Expense[]>('api/Expense');
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
        fetchExpenses();
        return () => {};
    }, [fetchExpenses, isAuthReady, accessToken]);

    const addExpense = () => {
        setEditingExpense(null);
        setIsFormOpen(true);
    };

    const editExpense = (expense: Expense) => {
        setEditingExpense(expense);
        setIsFormOpen(true);
    };

    const handleSubmit = async (data: Expense) => {
        if (editingExpense != null) {
            console.log("UPDATE", data);
            await putData('api/Expense', data);
        } else {
            console.log("CREATE", data);
            await postData('api/Expense', data);
        }

        setEditingExpense(null);
        setIsFormOpen(false);
        await fetchExpenses();
    };

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Expenses</h2> <Button onClick={addExpense}>Add Expense</Button>
            <ul>
                {Array.isArray(expenses) && expenses.map(expense => (
                    <li key={expense.id}>
                        {expense.title} - {expense.description} - {expense.amount} - {expense.date.toString()}
                        <Button onClick={() => editExpense(expense)}>Edit</Button>
                    </li>
                ))}
            </ul>
            <br />
            <DataTable columns={expenseColumns} data={expenses}/>
            {isFormOpen && (
                <ExpenseForm
                    key={editingExpense?.id ?? "new"}
                    row={editingExpense}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
}

export default ExpenseList;