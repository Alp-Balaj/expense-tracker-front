import React, { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Landmark, Wallet } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Checkbox } from "@/Components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";

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

  const toNumber = (value: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

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

  const accountSelect = (
    id: string,
    value: string,
    onChange: (next: string) => void,
    placeholder: string,
  ) => (
    <div className="relative">
      <Wallet className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-11 border-border bg-background pl-10">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{occurrence.title}</DialogTitle>
          <DialogDescription>
            {standing.label} · planned for {toISODate(occurrence.dueDate)}. Change
            anything that did not go to plan — nothing is recorded until you confirm.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="commit-amount" className="text-sm font-medium text-foreground">
              Amount
            </Label>
            <div className="relative">
              <Landmark className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="commit-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={data.amount || ""}
                onChange={(e) => setData({ ...data, amount: toNumber(e.target.value) })}
                className="h-11 border-border bg-background pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commit-date" className="text-sm font-medium text-foreground">
              Date
            </Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="commit-date"
                type="date"
                value={data.date}
                onChange={(e) => setData({ ...data, date: e.target.value })}
                className="h-11 border-border bg-background pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              When the money actually moved, which is often not the day it was due.
            </p>
          </div>

          {roles.from && (
            <div className="space-y-2">
              <Label htmlFor="commit-from" className="text-sm font-medium text-foreground">
                {occurrence.kind === PlannedKind.Transfer ? "From account" : "Paid from"}
              </Label>
              {accountSelect(
                "commit-from",
                data.fromAccountId,
                (v) => setData({ ...data, fromAccountId: v }),
                "Choose an account",
              )}
            </div>
          )}

          {roles.to && (
            <div className="space-y-2">
              <Label htmlFor="commit-to" className="text-sm font-medium text-foreground">
                {occurrence.kind === PlannedKind.Transfer ? "To account" : "Paid into"}
              </Label>
              {accountSelect(
                "commit-to",
                data.toAccountId,
                (v) => setData({ ...data, toAccountId: v }),
                "Choose an account",
              )}
            </div>
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

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 border-border bg-transparent px-6 hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || missingAccount || sameAccount || data.amount <= 0}
              className="h-11 gap-2 px-6"
            >
              Confirm
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
