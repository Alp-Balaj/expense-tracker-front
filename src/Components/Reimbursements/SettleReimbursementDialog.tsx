import React, { useMemo, useState } from "react";

import { FormShell } from "@/Components/Forms/shared/FormShell";
import { AmountField } from "@/Components/Forms/shared/AmountField";
import { ChipPicker } from "@/Components/Forms/shared/ChipPicker";
import { DateField } from "@/Components/Forms/shared/DateField";
import { currencySymbol } from "@/lib/identity";

import type { Reimbursement, SettleReimbursement } from "@/Models/Reimbursement";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useCurrency } from "@/Hooks/useCurrency";
import { todayISO } from "@/lib/dates";

export interface SettleReimbursementDialogProps {
  reimbursement: Reimbursement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, settlement: SettleReimbursement) => void | Promise<void>;
}

/** Money rounding — 60 − 20.1 is 39.900000000000006 without it. */
const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Recording that someone paid you back.
 *
 * <h3>Not income</h3>
 * This credits an account and shrinks a receivable, and that is all it does.
 * Nothing lands in the income statistics, because nobody earned anything — the
 * money was always yours, it was just out on loan.
 *
 * <h3>Defaulted to the whole remainder</h3>
 * People usually settle up in full, so the amount opens at what is still open
 * and the ordinary case is two clicks: pick the account, confirm. Typing over
 * it records a partial payback, and the line under the field says in advance
 * what that will leave outstanding.
 *
 * <h3>Any account you own</h3>
 * The payback rarely comes back the way it went out — the dinner left the card,
 * the cash lands in your wallet — so the target is chosen here rather than
 * inherited from the expense.
 */
export default function SettleReimbursementDialog({
  reimbursement,
  open,
  onOpenChange,
  onSubmit,
}: SettleReimbursementDialogProps) {
  const { data: accounts = [] } = useAccountsQuery();
  const { formatOriginal } = useCurrency();

  const initial = useMemo(
    () => ({
      amount: reimbursement?.openAmount ?? 0,
      accountId: "",
      date: todayISO(),
    }),
    [reimbursement],
  );

  const [data, setData] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  // Reset when the dialog opens or switches receivable. Adjusting state during
  // render rather than in an effect keeps it to one pass, matching the other
  // modals in the app.
  const formKey = `${open}:${reimbursement?.id ?? "none"}`;
  const [lastFormKey, setLastFormKey] = useState(formKey);
  if (formKey !== lastFormKey) {
    setLastFormKey(formKey);
    setData(initial);
    setSubmitting(false);
  }

  if (!reimbursement) return null;

  const money = (amount: number) => formatOriginal(amount, reimbursement.currencyCode);

  const stillOpen = reimbursement.openAmount;
  const remaining = round2(stillOpen - data.amount);
  const tooMuch = data.amount > stillOpen;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(reimbursement.id, {
        accountId: data.accountId,
        amount: data.amount,
        date: data.date,
      });
    } catch {
      setSubmitting(false);
      return; // the list shows the error toast and keeps this open to retry
    }
    onOpenChange(false);
  };

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={`Settle "${reimbursement.expenseTitle}"`}
      description={`${money(stillOpen)} of ${money(reimbursement.expectedAmount)} still owed to you, ${reimbursement.daysOpen}d after the expense.`}
      submitLabel="Record settlement"
      submitDisabled={submitting || data.amount <= 0 || tooMuch || !data.accountId}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[520px]"
    >
      <AmountField
        id="settle-amount"
        label="Paid back"
        value={data.amount}
        onChange={(amount) => setData({ ...data, amount })}
        currencySymbol={currencySymbol(reimbursement.currencyCode)}
      />

      <p
        data-testid="settle-remainder"
        className={`-mt-2 text-center text-xs ${tooMuch ? "text-destructive" : "text-muted-foreground"}`}
      >
        {tooMuch
          ? `That is more than the ${money(stillOpen)} still open.`
          : remaining > 0
            ? `${money(stillOpen)} open — ${money(remaining)} will still be out after this.`
            : `${money(stillOpen)} open — this settles it in full.`}
      </p>

      <ChipPicker
        label="Paid into"
        items={accounts.map((account) => ({ id: account.id, label: account.name }))}
        value={data.accountId}
        onChange={(accountId) => setData({ ...data, accountId })}
        emptyHint="No accounts yet."
      />

      <div className="space-y-2">
        <DateField
          value={data.date}
          onChange={(date) => setData({ ...data, date })}
        />
        <p className="text-xs text-muted-foreground">
          When the money actually came back, which is rarely the day of the bill.
        </p>
      </div>
    </FormShell>
  );
}
