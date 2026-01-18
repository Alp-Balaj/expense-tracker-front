import { useCallback, useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";
import { useAuth } from "../../Authorization/AuthContext.jsx";
import CurrencyForm from "../Forms/CurrencyForm";

function CurrencyList() {
    const { accessToken, isAuthReady } = useAuth();
    
    const [currencies, setCurrencies] = useState([]);    
    const { getAllData, postData, putData } = useAuthorizationApi();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState(null);

    const fetchCurrencies = useCallback(async () => {
        try {
            const data = await getAllData('api/Currency');
            setCurrencies(data);
        } catch (error) {
            if (error?.response?.status !== 401) {
                console.error(error);
            }
        }
    }, [getAllData]);
    
    useEffect(() => {
        if (!isAuthReady || !accessToken) return;
        fetchCurrencies();
        return () => {};
    }, [fetchCurrencies, isAuthReady, accessToken]);

    const addCurrency = () => {
        setEditingCurrency(null);
        setIsFormOpen(true);
    };
    const editCurrency = (currency) => {
        setEditingCurrency(currency);
        setIsFormOpen(true);
    };

    const handleSubmit = async (data) => {
        if (editingCurrency != null) {
            console.log("UPDATE", data);
            await putData('api/Currency', data);
        } else {
            console.log("CREATE", data);
            await postData('api/Currency', data);
        }

        setEditingCurrency(null);
        setIsFormOpen(false);
        await fetchCurrencies();
    };

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Currencies</h2> <button onClick={addCurrency}>Add Currency</button>
            <ul>
                {currencies.map(currency => (
                    <li key={currency.id}>
                        {currency.code} - {currency.symbol} - {currency.exchangeRateToBase}
                        <button onClick={() => editCurrency(currency)}>Edit</button>
                    </li>
                ))}
            </ul>
            {isFormOpen && (
                <CurrencyForm
                    key={editingCurrency?.id ?? "new"}
                    row={editingCurrency}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}
        </div>  
    );
}

export default CurrencyList;