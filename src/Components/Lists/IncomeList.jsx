import { useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAppAuthorizationApi";

function IncomeList() {
    const [incomes, setIncomes] = useState([]);
    const { getAllData } = useAuthorizationApi();
    
    const fetchIncomes = async () => {
        try {
            const data = await getAllData('api/Income');
            setIncomes(data);
        } catch (error) {
            console.error('Error fetching incomes:', error);
        }
    };
    
    useEffect(() => {
        fetchIncomes();
        return () => {};
    }, []);

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Incomes</h2>
            <ul>
                {incomes.map(income => (
                    <li key={income.id}>{income.description} - ${income.amount}</li>
                ))}
            </ul>
        </div>  
    );
}

export default IncomeList;