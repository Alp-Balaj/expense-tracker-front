import React, { useMemo, useState } from "react";

import { Checkbox } from "@/Components/ui/checkbox";
import { FormShell } from "@/Components/Forms/shared/FormShell";
import { AmountField } from "@/Components/Forms/shared/AmountField";
import { currencySymbol } from "@/lib/identity";
import { ChipPicker } from "@/Components/Forms/shared/ChipPicker";
import { DateField } from "@/Components/Forms/shared/DateField";

import { PlannedKind } from "@/Enums/enums";
import type { CommitOccurrence, PlannedOccurrence } from "@/Models/PlannedTransaction";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { accountRoles, dueStanding } from "@/lib/planned";
import { toISODate } from "@/lib/dates";

export interface CommitOccurrenceDialogProps {
  occurrence: PlannedOccurrence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, commit: CommitOccurrence) => void | Promise<void>;
}

/**
 * The step where a reminder becomes money.
 *
 * Nothing in this feature posts unattended, and this dialog is why: the due date
 * is a prediction, so the amount, the account and above all the date are the
 * user's to correct before anything is written. Everything is pre-filled from
 * the template — which committing keeps up to date with whatever was last used —
 * so the ordinary case is one click.
 */
export default function CommitOccurrenceDialog({
  occurrence,
  open,
  onOpenChange,
  onSubmit,
}: CommitOccurrenceDialogProps) {
  const { data: accounts = [] } = useAccountsQuery();

  const roles = occurrence ? accountRoles(occurrence.kind) : { from: false, to: false };

  const initial = useMemo(
    () => ({
      amount: occurrence?.amount ?? 0,
      date: toISODate(occurrence?.dueDate),
      fromAccountId: occurrence?.fromAccountId ?? "",
      toAccountId: occurrence?.toAccountId ?? "",
      updateTemplateAmount: false,
    }),
    [occurrence],
  );

  const [data, setData] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  // Reset when the dialog opens or switches occurrence. Adjusting state during
  // render rather than in an effect keeps it to one pass, matching the other
  // modals in the app.
  const formKey = `${open}:${occurrence?.id ?? "none"}`;
  const [lastFormKey, setLastFormKey] = useState(formKey);
  if (formKey !== lastFormKey) {
    setLastFormKey(formKey);
    setData(initial);
    setSubmitting(false);
  }

  if (!occurrence) return null;

  const standing = dueStanding(occurrence.dueDate);
  const amountChanged = data.amount !== occurrence.amount;

  const missingAccount =
    (roles.from && !data.fromAccountId) || (roles.to && !data.toAccountId);
  const sameAccount =
    occurrence.kind === PlannedKind.Transfer &&
    Boolean(data.fromAccountId) &&
    data.fromAccountId === data.toAccountId;

  const primaryAccount = accounts.find(
    (a) => a.id === (roles.from ? data.fromAccountId : data.toAccountId),
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const commit: CommitOccurrence = {
      amount: data.amount,
      date: data.date,
      updateTemplateAmount: amountChanged && data.updateTemplateAmount,
    };
    if (roles.from) commit.fromAccountId = data.fromAccountId;
    if (roles.to) commit.toAccountId = data.toAccountId;

    try {
      await onSubmit(occurrence.id, commit);
    } catch {
      setSubmitting(false);
      return; // the page shows the error toast and keeps this open to retry
    }
    onOpenChange(false);
  };

  const accountChips = (
    label: string,
    value: string,
    onChange: (next: string) => void,
  ) => (
    <ChipPicker
      label={label}
      items={accounts.map((account) => ({ id: account.id, label: account.name }))}
      value={value}
      onChange={onChange}
    />
  );

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={occurrence.title}
      description={`${standing.label} · planned for ${toISODate(occurrence.dueDate)}. Change anything that did not go to plan — nothing is recorded until you confirm.`}
      submitLabel="Confirm"
      submitDisabled={submitting || missingAccount || sameAccount || data.amount <= 0}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[520px]"
    >
      <AmountField
        id="commit-amount"
        value={data.amount}
        onChange={(amount) => setData({ ...data, amount })}
        currencySymbol={currencySymbol(primaryAccount?.currencyCode)}
      />

      <div className="space-y-2">
        <DateField
          value={data.date}
          onChange={(date) => setData({ ...data, date })}
        />
        <p className="text-xs text-muted-foreground">
          When the money actually moved, which is often not the day it was due.
        </p>
      </div>

      {roles.from &&
        accountChips(
          occurrence.kind === PlannedKind.Transfer ? "From account" : "Paid from",
          data.fromAccountId,
          (v) => setData({ ...data, fromAccountId: v }),
        )}

      {roles.to &&
        accountChips(
          occurrence.kind === PlannedKind.Transfer ? "To account" : "Paid into",
          data.toAccountId,
          (v) => setData({ ...data, toAccountId: v }),
        )}

      {sameAccount && (
        <p role="alert" className="text-xs text-destructive">
          A transfer needs two different accounts.
        </p>
      )}

      {/* Only worth asking once the number has actually changed. */}
      {amountChanged && (
        <label className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3 text-sm">
          <Checkbox
            checked={data.updateTemplateAmount}
            onCheckedChange={(checked) =>
              setData({ ...data, updateTemplateAmount: checked === true })
            }
            className="mt-0.5"
          />
          <span className="text-muted-foreground">
            Also make {data.amount.toFixed(2)} the expected amount from now on.
            Leave this off if it was a one-off change.
          </span>
        </label>
      )}
    </FormShell>
  );
}
