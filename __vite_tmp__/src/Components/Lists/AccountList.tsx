import { useCallback, useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi";
import AccountForm from "../Forms/AccountForm";
import type { Account } from "../../Models/Account";
import { useAuth } from "../../Authorization/AuthContext";
import type { AxiosError } from "axios";

export default function AccountList() {
  const { accessToken, isAuthReady } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const { getAllData, postData, putData } = useAuthorizationApi();
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await getAllData<Account[]>("api/Account");
      setAccounts(data);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        console.error(err);
      }
    }
  }, [getAllData]);

  useEffect(() => {
    if (!isAuthReady || !accessToken) return;
    fetchAccounts();
  }, [fetchAccounts, isAuthReady, accessToken]);

  const addAccount = () => {
    setEditingAccount(null);
    setIsFormOpen(true);
  };

  const editAccount = (account: Account) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: Account) => {
    if (editingAccount) {
      await putData<Account>("api/Account", data);
    } else {
      await postData<Account>("api/Account", data);
    }

    setEditingAccount(null);
    setIsFormOpen(false);
    await fetchAccounts();
  };

  return (
    <div style={{ backgroundColor: "#fff" }}>
      <h2>Accounts</h2> <button onClick={addAccount}>Add Account</button>

      <ul>
        {accounts.map((account) => (
          <li key={account.id ?? `${account.name}-${account.amountTypeId}`}>
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
