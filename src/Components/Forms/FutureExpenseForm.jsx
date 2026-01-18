import { useState } from "react";

function CurrencyForm({ row = {}, onSubmit, onCancel }) {
  console.log("data passed through", row);

  const [data, setData] = useState({
    id: row?.id || null,
    title: row?.title || "",
    amount: row?.amount || "",
    date: row?.date || "",
    categoryId: row?.categoryId || "",
    description: row?.description || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={data.title}
        onChange={(e) => setData({ ...data, title: e.target.value })}
        placeholder="Title"
      />
      
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
        value={data.categoryId}
        onChange={(e) => setData({ ...data, categoryId: e.target.value })}
        placeholder="Category Id"
      />

      <input
        value={data.description}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        placeholder="Description"
      />

      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}

export default CurrencyForm;