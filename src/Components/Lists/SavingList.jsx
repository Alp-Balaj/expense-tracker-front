import { useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";
import { useAuth } from "../../Authorization/AuthContext.jsx";
import SavingForm from "../Forms/SavingForm";

function SavingList() {
    const { accessToken, isAuthReady } = useAuth();

    const [savings, setSavings] = useState([]);
    const { getAllData, postData, putData } = useAuthorizationApi();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSaving, setEditingSaving] = useState(null);

    const fetchSavings = async () => {
        try {
            const data = await getAllData('api/Saving');
            setSavings(data);
        } catch (error) {
            if (error?.response?.status !== 401) {
                console.error(error);
            }
        }
    };
    
    useEffect(() => {
        if (!isAuthReady || !accessToken) return;
        fetchSavings();
        return () => {};
    }, []);

    const addSaving = () => {
        setEditingSaving(null);
        setIsFormOpen(true);
    };

    const editSaving = (saving) => {
        setEditingSaving(saving);
        setIsFormOpen(true);
    };

    const handleSubmit = async (data) => {
        if (editingSaving != null) {
            console.log("UPDATE", data);
            await putData('api/Saving', data);
        } else {
            console.log("CREATE", data);
            await postData('api/Saving', data);
        }

        setEditingSaving(null);
        setIsFormOpen(false);
        await fetchSavings();
    };

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Savings</h2> <button onClick={addSaving}>Add Saving</button>
            <ul>
                {savings.map(saving => (
                    <li key={saving.id}>
                        {saving.amount} - {saving.date} - {saving.accountId} - {saving.categoryId} - {saving.description}
                        <button onClick={() => editSaving(saving)}>Edit</button>
                    </li>
                ))}
            </ul>
            {isFormOpen && (
                <SavingForm
                    key={editingSaving?.id ?? "new"}
                    row={editingSaving}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}
        </div>  
    );
}

export default SavingList;