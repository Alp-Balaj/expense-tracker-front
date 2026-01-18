import { useState } from "react";

function CurrencyForm({ row = {}, onSubmit, onCancel }) {
  console.log("data passed through", row);

  const [data, setData] = useState({
    id: row?.id || null,
    amount: row?.amount || "",
    date: row?.date || new Date().toISOString().split('T')[0],
    description: row?.description || "",
    accountId: row?.accountId || null,
    categoryId: row?.categoryId || null
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={data.amount}
        onChange={(e) => setData({ ...data, amount: e.target.value })}
        placeholder="Amount"
      />

      <input
        value={data.date}
        onChange={(e) => setData({ ...data, date: e.target.value })}
        placeholder="Date"
      />

      <input
        value={data.description}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        placeholder="Description"
      />

      <input
        value={data.accountId}
        onChange={(e) => setData({ ...data, accountId: e.target.value })}
        placeholder="Account Id"
      />

      <input
        value={data.categoryId}
        onChange={(e) => setData({ ...data, categoryId: e.target.value })}
        placeholder="Category Id"
      />

      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}

export default CurrencyForm;