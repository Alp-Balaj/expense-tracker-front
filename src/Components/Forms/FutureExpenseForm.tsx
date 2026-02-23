import React, { useState, useEffect } from "react";
import type {
  FutureExpense,
  FutureExpenseFormProps,
} from "../../Models/FutureExpense";
import { Button } from "../ui/button";

export default function FutureExpenseForm({
  row,
  onSubmit,
  open,
  onCancel,
}: FutureExpenseFormProps) {
  const [data, setData] = useState<FutureExpense>(() => ({
    id: row?.id ?? null,
    title: row?.title ?? "",
    amount: row?.amount ?? 0,
    date: row?.date ? new Date(row.date) : new Date(),
    categoryId: row?.categoryId ?? "",
    description: row?.description ?? "",
  }));

  useEffect(() => {
    if (open) {
      Promise.resolve().then(() => {
        setData({
          id: row?.id ?? null,
          title: row?.title ?? "",
          amount: row?.amount ?? 0,
          date: row?.date ? new Date(row.date) : new Date(),
          categoryId: row?.categoryId ?? "",
          description: row?.description ?? "",
        });
      });
    }
  }, [row, open]);

  const toNumber = (value: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const toDate = (value: string) => new Date(`${value}T00:00:00`);

  const toDateInputValue = (d: Date) => d.toISOString().slice(0, 10);

  const handleChange = <K extends keyof FutureExpense>(
    key: K,
    value: FutureExpense[K],
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        value={data.title}
        onChange={(e) => handleChange("title", e.target.value)}
        placeholder="Title"
      />

      <input
        type="number"
        value={data.amount}
        onChange={(e) => handleChange("amount", toNumber(e.target.value))}
        placeholder="Amount"
      />

      <input
        type="date"
        value={toDateInputValue(data.date)}
        onChange={(e) => handleChange("date", toDate(e.target.value))}
        placeholder="Date"
      />

      <input
        value={data.categoryId}
        onChange={(e) => handleChange("categoryId", e.target.value)}
        placeholder="Category Id"
      />

      <input
        value={data.description}
        onChange={(e) => handleChange("description", e.target.value)}
        placeholder="Description"
      />

      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
