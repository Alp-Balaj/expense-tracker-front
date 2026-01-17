import { useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";

function SavingList() {
    const [savings, setSavings] = useState([]);
    const { getAllData } = useAuthorizationApi();
    
    const fetchSavings = async () => {
        try {
            const data = await getAllData('api/Saving');
            setSavings(data);
        } catch (error) {
            console.error('Error fetching savings:', error);
        }
    };
    
    useEffect(() => {
        fetchSavings();
        return () => {};
    }, []);

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Savings</h2>
            <ul>
                {savings.map(saving => (
                    <li key={saving.id}>{saving.amount}$ - {saving.date} - {saving.accountId} - {saving.categoryId} - {saving.description}</li>
                ))}
            </ul>
        </div>  
    );
}

export default SavingList;