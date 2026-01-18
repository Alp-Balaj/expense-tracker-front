import React, { useMemo, useState } from "react";
import type { Currency, CurrencyFormProps } from "../../Models/Currency";

export default function CurrencyForm({
  row,
  onSubmit,
  onCancel,
}: CurrencyFormProps) {
  const initial: Currency = useMemo(
    () => ({
      id: row?.id ?? null,
      code: row?.code ?? "",
      symbol: row?.symbol ?? "",
      exchangeRateToBase: row?.exchangeRateToBase ?? 0,
    }),
    [row]
  );

  const [data, setData] = useState<Currency>(initial);

  React.useEffect(() => {
    setData(initial);
  }, [initial]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(data);
  };

  const toNumber = (value: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
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
        onChange={(e) => setData({ ...data, exchangeRateToBase: toNumber(e.target.value) })}
        placeholder="Exchange Rate To Base"
      />

      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}