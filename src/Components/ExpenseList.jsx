import { useEffect, useState } from "react";
import { useAuthorizationApi } from "../Hooks/useAppAuthorizationApi";

function ExpenseList() {
    const [expenses, setExpenses] = useState([]);
    const { getAllData } = useAuthorizationApi();
    
    useEffect( () => {
        const fetchExpenses = async () => {
            try {
                const data = await getAllData('api/Expense');
                setExpenses(data);
            } catch (error) {
                console.error('Error fetching expenses:', error);
            }
        };
        fetchExpenses();
        console.log("expenses", expenses);
        return () => {};
    }, []);

    return (
        <div>

        </div>
    );
}

export default ExpenseList;