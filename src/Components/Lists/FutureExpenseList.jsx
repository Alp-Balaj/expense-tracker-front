import { useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";
import { useAuth } from "../../Authorization/AuthContext.jsx";
import FutureExpenseForm from "../Forms/FutureExpenseForm";

function FutureExpenseList() {
    const { accessToken, isAuthReady } = useAuth();

    const [futureExpense, setFutureExpense] = useState([]);
    const { getAllData, postData, putData } = useAuthorizationApi();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingFutureExpense, setEditingFutureExpense] = useState(null);
    
    const fetchFutureExpense = async () => {
        try {
            const data = await getAllData('api/FutureExpense');
            setFutureExpense(data);
        } catch (error) {
            if (error?.response?.status !== 401) {
                console.error(error);
            }
        }
    };
    
    useEffect(() => {
        if (!isAuthReady || !accessToken) return;
        fetchFutureExpense();
        return () => {};
    }, []);

    const addFutureExpense = () => {
        setEditingFutureExpense(null);
        setIsFormOpen(true);
    };

    const editFutureExpense = (futureExpense) => {
        setEditingFutureExpense(futureExpense);
        setIsFormOpen(true);
    };

    const handleSubmit = async (data) => {
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
                        {futureExpense.title} - {futureExpense.amount} - {futureExpense.date} - {futureExpense.categoryId} - {futureExpense.description}
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