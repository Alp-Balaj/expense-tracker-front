import React, { useMemo, useState } from "react";
import type { Account, AccountFormProps } from "../../Models/Account";

export default function AccountForm({
  row,
  onSubmit,
  onCancel,
}: AccountFormProps) {
  const initial: Account = useMemo(
    () => ({
      id: row?.id ?? null,
      name: row?.name ?? "",
      amountTypeId: row?.amountTypeId ?? "",
      balance: row?.balance ?? 0,
      balanceCurrencyId: row?.balanceCurrencyId ?? "",
    }),
    [row]
  );

  const [data, setData] = useState<Account>(initial);

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
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
        placeholder="Name"
      />

      <input
        value={data.amountTypeId}
        onChange={(e) =>
          setData({ ...data, amountTypeId: e.target.value })
        }
        placeholder="Amount Type ID"
        inputMode="numeric"
      />

      <input
        value={data.balance}
        onChange={(e) =>
          setData({ ...data, balance: toNumber(e.target.value) })
        }
        placeholder="Balance"
        inputMode="decimal"
      />

      <input
        value={data.balanceCurrencyId}
        onChange={(e) =>
          setData({ ...data, balanceCurrencyId: e.target.value })
        }
        placeholder="Balance Currency ID"
        inputMode="numeric"
      />

      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}
