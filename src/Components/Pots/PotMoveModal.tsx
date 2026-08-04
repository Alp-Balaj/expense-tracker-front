import React, { useEffect, useMemo, useState } from "react";

import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { AmountField } from "@/Components/Forms/shared/AmountField";
import { ChipPicker } from "@/Components/Forms/shared/ChipPicker";
import { DateField } from "@/Components/Forms/shared/DateField";
import { FormShell } from "@/Components/Forms/shared/FormShell";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { currencySymbol } from "@/lib/identity";
import { todayISO } from "@/lib/dates";
import { formatPotAmount } from "@/lib/potMoney";

export interface PotMoveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which way the money goes. */
  direction: "in" | "out";
  currencyCode: string;
  /** For "out": the most this member may take, from their own position. */
  limit?: number;
  onSubmit: (move: {
    amount: number;
    accountId: string;
    date: string;
    note: string | null;
  }) => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * Money into the pot, or back out of it.
 *
 * One component for both because they are the same gesture in two directions —
 * an amount, one of your own accounts, and a date — and two nearly identical
 * files would drift apart at the first change to either. What differs is the
 * words and the cap, and both are parameters.
 *
 * <h3>Neither of these is a settlement</h3>
 * A top-up is a **transfer**: it debits the account and moves no budget,
 * because the money is not consumed yet — it is in the pot with your name still
 * on it. A withdrawal is that in reverse: your own unspent stake, coming back.
 * Paying another member for what you consumed is a different operation
 * entirely, and it arrives in W3.
 *
 * <h3>The cap is the server's</h3>
 * `limit` comes from the ledger's `withdrawable`, which is the member's
 * position capped at the cash actually in the pot. The form shows it and
 * refuses past it; the endpoint enforces it again. Both, because a form that
 * only warns is a form that eventually lets something through.
 */
export default function PotMoveModal({
  open,
  onOpenChange,
  direction,
  currencyCode,
  limit,
  onSubmit,
  onCancel,
}: PotMoveModalProps) {
  const { data: accounts = [] } = useAccountsQuery();
  const isIn = direction === "in";

  const blank = useMemo(() => ({ amount: 0, date: todayISO(), note: "" }), []);
  const [data, setData] = useState(blank);
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    if (!open) return;
    setData(blank);
    setAccountId(accounts[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, blank]);

  const overLimit = !isIn && limit !== undefined && data.amount > limit;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await onSubmit({
        amount: data.amount,
        accountId,
        date: data.date,
        note: data.note.trim() || null,
      });
    } catch {
      return;
    }

    onOpenChange(false);
  };

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      onCancel={onCancel}
      title={isIn ? "Add money to the pot" : "Take money out"}
      description={
        isIn
          ? "Moves money from one of your accounts into the pot. It is not spent yet, so it does not touch your budgets."
          : "Moves your own unspent share back to one of your accounts."
      }
      submitLabel={isIn ? "Add to pot" : "Take out"}
      submitDisabled={data.amount <= 0 || accountId.length === 0 || overLimit}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[520px]"
    >
      <AmountField
        id={isIn ? "pot-topup-amount" : "pot-withdraw-amount"}
        label="How much?"
        value={data.amount}
        onChange={(amount) => setData({ ...data, amount })}
        currencySymbol={currencySymbol(currencyCode)}
        autoFocus
      />

      {!isIn && limit !== undefined && (
        <p
          role={overLimit ? "alert" : undefined}
          className={overLimit ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
        >
          {overLimit
            ? `You can take out at most ${formatPotAmount(limit, currencyCode)} — that is your share of what is in the pot.`
            : `Yours to take out: ${formatPotAmount(limit, currencyCode)}.`}
        </p>
      )}

      <ChipPicker
        label={isIn ? "From which account?" : "Into which account?"}
        items={accounts.map((a) => ({ id: a.id, label: a.name }))}
        value={accountId}
        onChange={setAccountId}
        emptyHint="You need an account before you can move money."
      />

      <DateField
        label="When?"
        value={data.date}
        onChange={(date) => setData({ ...data, date })}
      />

      <div className="space-y-2">
        <Label htmlFor="pot-move-note" className="text-sm font-medium text-foreground">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="pot-move-note"
          value={data.note}
          onChange={(e) => setData({ ...data, note: e.target.value })}
          placeholder={isIn ? "e.g. August kitty" : "e.g. leaving after the trip"}
          className="h-11 border-border bg-background"
          maxLength={200}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        The other members see the amount and your name — never which account it was.
      </p>
    </FormShell>
  );
}
