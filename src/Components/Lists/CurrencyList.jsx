import { useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";

function CurrencyList() {
    const [currencies, setCurrencies] = useState([]);
    const { getAllData } = useAuthorizationApi();
    
    const fetchCurrencies = async () => {
        try {
            const data = await getAllData('api/Currency');
            setCurrencies(data);
        } catch (error) {
            console.error('Error fetching currencies:', error);
        }
    };
    
    useEffect(() => {
        fetchCurrencies();
        return () => {};
    }, []);

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Currencies</h2>
            <ul>
                {currencies.map(currency => (
                    <li key={currency.id}>{currency.code} - {currency.symbol} - {currency.exchangeRateToBase}</li>
                ))}
            </ul>
        </div>  
    );
}

export default CurrencyList;