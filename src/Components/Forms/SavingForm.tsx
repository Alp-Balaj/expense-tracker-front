import React, { useMemo, useState } from "react";
import type { Saving, SavingFormProps } from "../../Models/Saving";
import { toISODate } from "@/lib/dates";
import { Button } from "../ui/button";

export default function SavingForm({
  row,
  onSubmit,
  onCancel,
}: SavingFormProps) {
  const initial: Saving = useMemo(
    () => ({
      id: row?.id ?? null,
      amount: row?.amount ?? 0,
      date: toISODate(row?.date),
      description: row?.description ?? "",
      accountId: row?.accountId ?? "",
      categoryId: row?.categoryId ?? ""
    }),
    [row]
  );

  const [data, setData] = useState<Saving>(initial);

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
        type="number"
        value={data.amount}
        onChange={(e) => setData({ ...data, amount: toNumber(e.target.value) })}
        placeholder="Amount"
      />

      <input
        type="date"
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