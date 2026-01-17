import { useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx"
import AccountForm from "../Forms/AccountForm";
import { useAuth } from "../../Authorization/AuthContext.jsx";

function AccountList() {
    const { accessToken, isAuthReady } = useAuth();

    const [accounts, setAccounts] = useState([]);
    const { getAllData, postData, putData } = useAuthorizationApi();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    
    const fetchAccounts = async () => {
        try {
            const data = await getAllData("api/Account");
            setAccounts(data);
        } catch (err) {
            if (err?.response?.status !== 401) {
                console.error(err);
            }
        }
    };
    
    useEffect(() => {
        if (!isAuthReady || !accessToken) return;
        fetchAccounts();
        return () => {};
    }, []);

    const addAccount = () => {
        setEditingAccount(null);
        setIsFormOpen(true);
    };

    const editAccount = (account) => {
        setEditingAccount(account);
        setIsFormOpen(true);
    };

    const handleSubmit = async (data) => {
        if (editingAccount != null) {
            console.log("UPDATE", data);
            await putData('api/Account', data);
        } else {
            console.log("CREATE", data);
            await postData('api/Account', data);
        }
        
        setEditingAccount(null);
        setIsFormOpen(false);
        await fetchAccounts();
    };

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Accounts</h2> <button onClick={addAccount}>Add Account</button>
            <ul>
                {accounts.map(account => (
                    <li key={account.id}>
                        {account.name} - {account.amountTypeId} - {account.balance} - {account.balanceCurrencyId}
                        <button onClick={() => editAccount(account)}>Edit</button>
                    </li>
                ))}
            </ul>
            {isFormOpen && (
                <AccountForm
                    key={editingAccount?.id ?? "new"}
                    row={editingAccount}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
}

export default AccountList;