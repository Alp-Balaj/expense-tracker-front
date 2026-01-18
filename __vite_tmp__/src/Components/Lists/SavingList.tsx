import { useCallback, useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";
import { useAuth } from "../../Authorization/AuthContext.js";
import SavingForm from "../Forms/IncomeForm.js";
import type { Saving } from "../../Models/Saving.tsx";
import type { AxiosError } from "axios";

function SavingList() {
    const { accessToken, isAuthReady } = useAuth();
    
    const [savings, setSavings] = useState<Saving[]>([]);
    const { getAllData, postData, putData } = useAuthorizationApi();
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
    
    const fetchSaving = useCallback(async () => {
        try {
            const data = await getAllData<Saving[]>('api/Saving');
            setSavings(data);
        } catch (e: unknown) {
            const err = e as AxiosError;
            if (err.response?.status !== 401) {
            console.error(err);
            }
        }
    }, [getAllData]);

    useEffect(() => {
        if (!isAuthReady || !accessToken) return;
        fetchSaving();
        return () => {};
    }, [fetchSaving, isAuthReady, accessToken]);

    const addSaving = () => {
        setEditingSaving(null);
        setIsFormOpen(true);
    };

    const editSaving = (Saving: Saving) => {
        setEditingSaving(Saving);
        setIsFormOpen(true);
    };

    const handleSubmit = async (data: Saving) => {
        if (editingSaving != null) {
            await putData('api/Saving', data);
        } else {
            await postData('api/Saving', data);
        }

        setEditingSaving(null);
        setIsFormOpen(false);
        await fetchSaving();
    };

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Savings</h2> <button onClick={addSaving}>Add Saving</button>
            <ul>
                {savings.map(saving => (
                    <li key={saving.id}>
                        {saving.amount} - {saving.date.toString()} - {saving.accountId} - {saving.categoryId} - {saving.description}
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