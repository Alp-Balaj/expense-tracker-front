import { useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAppAuthorizationApi";

function ExpenseList() {
    const [expenses, setExpenses] = useState([]);
    const { getAllData } = useAuthorizationApi();
    
    const fetchExpenses = async () => {
        try {
            const data = await getAllData('api/Expense');
            setExpenses(data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
    };

    useEffect(() => {
        fetchExpenses();
        return () => {};
    }, []);

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Expenses</h2>
            <ul>
                {expenses.map(expense => (
                    <li key={expense.id}>{expense.description} - ${expense.amount}</li>
                ))}
            </ul>
        </div>  
    );
}

export default ExpenseList;