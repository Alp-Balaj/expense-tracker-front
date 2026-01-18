import React, { useMemo, useState } from "react";
import type { Expense, ExpenseFormProps } from "../../Models/Expense";
import { Button } from "../ui/button";

export default function ExpenseForm({
  row,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const initial: Expense = useMemo(
    () => ({
      id: row?.id ?? null,
      title: row?.title ?? "",
      amount: row?.amount ?? 0,
      date: row?.date ? new Date(row.date) : new Date(),
      description: row?.description ?? "",
      accountId: row?.accountId ?? "",
      categoryId: row?.categoryId ?? ""
    }),
    [row]
  );

  const [data, setData] = useState<Expense>(initial);

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
  
  const toDate = (value: string) => new Date(`${value}T00:00:00`);

  const toDateInputValue = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={data.title}
        onChange={(e) => setData({ ...data, title: e.target.value })}
        placeholder="Title"
      />

      <input
        type="number"
        value={data.amount}
        onChange={(e) => setData({ ...data, amount: toNumber(e.target.value) })}
        placeholder="Amount"
      />

      <input
        type="date"
        value={toDateInputValue(data.date)}
        onChange={(e) => setData({ ...data, date: toDate(e.target.value) })}
        placeholder="Date"
      />

      <input
        value={data.description}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        placeholder="Description"
      />

      <input
        value={String(data.accountId)}
        onChange={(e) => setData({ ...data, accountId: e.target.value })}
        placeholder="Account Id"
      />

      <input
        value={String(data.categoryId)}
        onChange={(e) => setData({ ...data, categoryId: e.target.value })}
        placeholder="Category Id"
      />

      <Button type="submit">Save</Button>
      <Button type="button" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}