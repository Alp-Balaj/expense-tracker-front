// import { useCallback, useEffect, useState } from "react";
// import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";
// import { useAuth } from "../../Authorization/AuthContext.js";
// import CurrencyForm from "../Forms/CurrencyForm.js";
// import type { Currency } from "../../Models/Currency.tsx";
// import type { AxiosError } from "axios";
// import { Button } from "../ui/button.tsx";

// function CurrencyList() {
//     const { accessToken, isAuthReady } = useAuth();
    
//     const [currencies, setCurrencies] = useState<Currency[]>([]);    
//     const { getAllData, postData, putData } = useAuthorizationApi();
//     const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
//     const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

//     const fetchCurrencies = useCallback(async () => {
//         try {
//             const data = await getAllData<Currency[]>('api/Currency');
//             setCurrencies(data);
//         } catch (e: unknown) {
//             const err = e as AxiosError;
//             if (err.response?.status !== 401) {
//             console.error(err);
//             }
//         }
//     }, [getAllData]);
    
//     useEffect(() => {
//         if (!isAuthReady || !accessToken) return;
//         fetchCurrencies();
//         return () => {};
//     }, [fetchCurrencies, isAuthReady, accessToken]);

//     const addCurrency = () => {
//         setEditingCurrency(null);
//         setIsFormOpen(true);
//     };
//     const editCurrency = (currency: Currency) => {
//         setEditingCurrency(currency);
//         setIsFormOpen(true);
//     };

//     const handleSubmit = async (data: Currency) => {
//         if (editingCurrency != null) {
//             console.log("UPDATE", data);
//             await putData('api/Currency', data);
//         } else {
//             console.log("CREATE", data);
//             await postData('api/Currency', data);
//         }

//         setEditingCurrency(null);
//         setIsFormOpen(false);
//         await fetchCurrencies();
//     };

//     return (
//         <div style={{backgroundColor: '#fff'}}>
//             <h2>Currencies</h2> <Button onClick={addCurrency}>Add Currency</Button>
//             <ul>
//                 {Array.isArray(currencies) && currencies.map(currency => (
//                     <li key={currency.id}>
//                         {currency.code} - {currency.symbol} - {currency.exchangeRateToBase}
//                         <Button onClick={() => editCurrency(currency)}>Edit</Button>
//                     </li>
//                 ))}
//             </ul>
//             {isFormOpen && (
//                 <CurrencyForm
//                     key={editingCurrency?.id ?? "new"}
//                     row={editingCurrency}
//                     onSubmit={handleSubmit}
//                     onCancel={() => setIsFormOpen(false)}
//                 />
//             )}
//         </div>  
//     );
// }

// export default CurrencyList;