import { useState } from "react";

function CurrencyForm({ row = {}, onSubmit, onCancel }) {
  console.log("data passed through", row);

  const [data, setData] = useState({
    id: row?.id || null,
    code: row?.code || "",
    symbol: row?.symbol || "",
    exchangeRateToBase: row?.exchangeRateToBase || 0
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={data.code}
        onChange={(e) => setData({ ...data, code: e.target.value })}
        placeholder="Code"
      />
      
      <input
        value={data.symbol}
        onChange={(e) => setData({ ...data, symbol: e.target.value })}
        placeholder="Symbol"
      />

      <input
        value={data.exchangeRateToBase}
        onChange={(e) => setData({ ...data, exchangeRateToBase: e.target.value })}
        placeholder="Exchange Rate To Base"
      />

      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}

export default CurrencyForm;