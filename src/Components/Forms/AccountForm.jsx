import { useState } from "react";

function AccountForm({ row = {}, onSubmit, onCancel }) {
  console.log("data passed through", row);

  const [data, setData] = useState({
    id: row?.id || null,
    name: row?.name || "",
    amountTypeId: row?.amountTypeId || 0,
    balance: row?.balance || 0,
    balanceCurrencyId: row?.balanceCurrencyId || 0
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
        placeholder="Name"
      />
      
      <input
        value={data.amountTypeId}
        onChange={(e) => setData({ ...data, amountTypeId: e.target.value })}
        placeholder="Amount Type ID"
      />

      <input
        value={data.balance}
        onChange={(e) => setData({ ...data, balance: e.target.value })}
        placeholder="Balance"
      />

      <input
        value={data.balanceCurrencyId}
        onChange={(e) => setData({ ...data, balanceCurrencyId: e.target.value })}
        placeholder="Balance Currency ID"
      />

      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}

export default AccountForm;