import { useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAppAuthorizationApi";

function FutureExpenseList() {
    const [futureExpense, setFutureExpense] = useState([]);
    const { getAllData } = useAuthorizationApi();
    
    const fetchFutureExpense = async () => {
        try {
            const data = await getAllData('api/FutureExpense');
            setFutureExpense(data);
        } catch (error) {
            console.error('Error fetching future expenses:', error);
        }
    };
    
    useEffect(() => {
        fetchFutureExpense();
        return () => {};
    }, []);

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Future Expenses</h2>
            <ul>
                {futureExpense.map(futureExpense => (
                    <li key={futureExpense.id}>{futureExpense.title} - {futureExpense.amount}$ - {futureExpense.date} - {futureExpense.categoryId} - {futureExpense.description}</li>
                ))}
            </ul>
        </div>  
    );
}

export default FutureExpenseList;