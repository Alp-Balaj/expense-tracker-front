import { useCallback, useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";
import { useAuth } from "../../Authorization/AuthContext.jsx";
import IncomeForm from "../Forms/IncomeForm";

function IncomeList() {
    const { accessToken, isAuthReady } = useAuth();
    
    const [incomes, setIncomes] = useState([]);
    const { getAllData, postData, putData } = useAuthorizationApi();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState(null);
    
    const fetchIncomes = useCallback(async () => {
        try {
            const data = await getAllData('api/Income');
            setIncomes(data);
        } catch (error) {
            if (error?.response?.status !== 401) {
                console.error(error);
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

    const editIncome = (income) => {
        setEditingIncome(income);
        setIsFormOpen(true);
    };

    const handleSubmit = async (data) => {
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
                        {income.description} - {income.amount} - {income.date}
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