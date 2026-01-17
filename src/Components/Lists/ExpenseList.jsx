import { useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";
import { useAuth } from "../../Authorization/AuthContext.jsx";
import ExpenseForm from "../Forms/ExpenseForm";

function ExpenseList() {
    const { accessToken, isAuthReady } = useAuth();
    
    const [expenses, setExpenses] = useState([]);
    const { getAllData, postData, putData } = useAuthorizationApi();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    
    const fetchExpenses = async () => {
        try {
            const data = await getAllData('api/Expense');
            setExpenses(data);
        } catch (error) {
            if (error?.response?.status !== 401) {
                console.error(error);
            }
        }
    };

    useEffect(() => {
        if (!isAuthReady || !accessToken) return;
        fetchExpenses();
        return () => {};
    }, []);

    const addExpense = () => {
        setEditingExpense(null);
        setIsFormOpen(true);
    };

    const editExpense = (expense) => {
        setEditingExpense(expense);
        setIsFormOpen(true);
    };

    const handleSubmit = async (data) => {
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
            <h2>Expenses</h2> <button onClick={addExpense}>Add Expense</button>
            <ul>
                {expenses.map(expense => (
                    <li key={expense.id}>
                        {expense.title} - {expense.description} - {expense.amount} - {expense.date}
                        <button onClick={() => editExpense(expense)}>Edit</button>
                    </li>
                ))}
            </ul>
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