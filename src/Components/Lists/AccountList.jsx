import { useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAppAuthorizationApi";
import AccountForm from "../Forms/AccountForm";

function AccountList() {
    const [accounts, setAccounts] = useState([]);
    const { getAllData, postData, putData } = useAuthorizationApi();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    
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

    const addAccount = () => {
        setEditingAccount(null);
        setIsFormOpen(true);
    };

    const editAccount = (account) => {
        console.log("Editing account:", account);
        setEditingAccount(account);
        setIsFormOpen(true);
    };

    const handleSubmit = async (data) => {
        if (data.id) {
            console.log("UPDATE", data);
            await putData('api/Account', data);
        } else {
            console.log("CREATE", data);
            await postData('api/Account', data);
        }
        
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