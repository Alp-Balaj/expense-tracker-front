import { useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAppAuthorizationApi";

function AccountList() {
    const [accounts, setAccounts] = useState([]);
    const { getAllData } = useAuthorizationApi();
    
    const fetchAccounts = async () => {
        try {
            const data = await getAllData('api/Account');
            setAccounts(data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };
    
    useEffect(() => {
        fetchAccounts();
        return () => {};
    }, []);

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Accounts</h2>
            <ul>
                {accounts.map(account => (
                    <li key={account.id}>{account.name} - {account.amountTypeId} - {account.balanceCurrencyId}</li>
                ))}
            </ul>
        </div>  
    );
}

export default AccountList;