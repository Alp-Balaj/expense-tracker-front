import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PiggyBank } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Checkbox } from "@/Components/ui/checkbox";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { FormShell } from "@/Components/Forms/shared/FormShell";
import { AmountField } from "@/Components/Forms/shared/AmountField";
import { currencySymbol } from "@/lib/identity";
import { ChipPicker } from "@/Components/Forms/shared/ChipPicker";
import { DateField } from "@/Components/Forms/shared/DateField";

import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useSavingGoalsQuery } from "@/Hooks/queries/useSavingGoals";
import { emptyTransfer, type Transfer } from "@/Models/Transfer";
import type { SavingGoals } from "@/Models/SavingGoals";
import { toISODate, todayISO } from "@/lib/dates";

export interface TransferFormModalProps {
  row?: Transfer | null;
  onSubmit: (data: Transfer) => void | Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: () => void;
}

export default function TransferFormModal({
  row,
  onSubmit,
  open,
  onOpenChange,
  onCancel,
}: TransferFormModalProps) {
  const navigate = useNavigate();

  const { data: accounts = [] } = useAccountsQuery();
  const { data: goals = [] } = useSavingGoalsQuery();

  const initial: Transfer = useMemo(
    () => ({
      ...(row ?? emptyTransfer(todayISO())),
      date: toISODate(row?.date),
    }),
    [row],
  );

  const [data, setData] = useState<Transfer>(initial);
  const [creditGoal, setCreditGoal] = useState(!!initial.savingGoalId);

  useEffect(() => {
    setData(initial);
    setCreditGoal(!!initial.savingGoalId);
  }, [open, initial]);

  const source = accounts.find((a) => a.id === data.fromAccountId);

  // v1 moves a single amount, which only describes both sides when the two
  // accounts agree on the currency — so the destination list hides the
  // accounts the backend would reject anyway.
  const destinations = useMemo(
    () =>
      accounts.filter(
        (a) => a.id !== data.fromAccountId && (!source || a.currencyId === source.currencyId),
      ),
    [accounts, data.fromAccountId, source],
  );

  // Stream V: a goal is no longer backed by one account, so any transfer may
  // credit any goal — the contribution books on the destination, where the
  // money actually lands. The one rule left is currency: a goal reserves in
  // one, so a goal already holding money in another is hidden rather than
  // offered and then refused. An empty goal has no currency yet and is always
  // eligible, exactly as the API treats it.
  const destination = useMemo(
    () => accounts.find((a) => a.id === data.toAccountId),
    [accounts, data.toAccountId],
  );

  const isEligible = useCallback(
    (goal: SavingGoals) =>
      !!destination && (!goal.currencyCode || goal.currencyCode === destination.currencyCode),
    [destination],
  );

  const eligibleGoals = useMemo(() => goals.filter(isEligible), [goals, isEligible]);

  // Repointing the destination can invalidate both the chosen destination and
  // the chosen goal (both on currency); drop them rather than submitting a
  // combination the API will refuse.
  const handleSourceChange = (fromAccountId: string) => {
    const nextSource = accounts.find((a) => a.id === fromAccountId);
    const destination = accounts.find((a) => a.id === data.toAccountId);
    const destinationStillValid =
      destination && destination.id !== fromAccountId && destination.currencyId === nextSource?.currencyId;

    setData((prev) => ({
      ...prev,
      fromAccountId,
      toAccountId: destinationStillValid ? prev.toAccountId : "",
      savingGoalId: destinationStillValid ? prev.savingGoalId : null,
    }));
    if (!destinationStillValid) setCreditGoal(false);
  };

  const handleDestinationChange = (toAccountId: string) => {
    const nextDestination = accounts.find((a) => a.id === toAccountId);
    const stillEligible = goals.some(
      (g) =>
        g.id === data.savingGoalId &&
        !!nextDestination &&
        (!g.currencyCode || g.currencyCode === nextDestination.currencyCode),
    );
    setData((prev) => ({
      ...prev,
      toAccountId,
      savingGoalId: stillEligible ? prev.savingGoalId : null,
    }));
    if (!stillEligible) setCreditGoal(false);
  };

  const handleCreditGoalChange = (checked: boolean) => {
    setCreditGoal(checked);
    setData((prev) => ({
      ...prev,
      // One eligible goal is the overwhelmingly common case — don't make the
      // user pick from a list of one.
      savingGoalId: checked ? (eligibleGoals.length === 1 ? eligibleGoals[0].id : null) : null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await onSubmit(data);
    } catch {
      return; // error toast shown by the submit handler; keep the dialog open
    }
    onOpenChange(false);
  };

  const canSubmit =
    !!data.fromAccountId &&
    !!data.toAccountId &&
    data.amount > 0 &&
    (!creditGoal || !!data.savingGoalId);

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      onCancel={onCancel}
      title={row ? "Edit Transfer" : "Transfer Between Accounts"}
      description="Moving your own money — this does not count as income or expense."
      submitLabel={row ? "Update Transfer" : "Transfer"}
      submitDisabled={!canSubmit}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[550px]"
    >
      <AmountField
        value={data.amount}
        onChange={(amount) => setData((prev) => ({ ...prev, amount }))}
        currencySymbol={currencySymbol(source?.currencyCode)}
        autoFocus={!row}
      />

      <ChipPicker
        label="From"
        items={accounts.map((a) => ({
          id: a.id,
          label: `${a.name} (${a.currencyCode})`,
        }))}
        value={data.fromAccountId}
        onChange={handleSourceChange}
        onAddNew={() => {
          onOpenChange(false);
          navigate("/account");
        }}
        addNewLabel="New account"
        emptyHint="No accounts yet."
      />

      <ChipPicker
        label="To"
        // Destinations only make sense relative to a source; until one is
        // picked the chips stay hidden behind the hint.
        items={
          data.fromAccountId
            ? destinations.map((a) => ({
                id: a.id,
                label: `${a.name} (${a.currencyCode})`,
              }))
            : []
        }
        value={data.toAccountId}
        onChange={handleDestinationChange}
        emptyHint={
          data.fromAccountId
            ? `No other ${source?.currencyCode} account yet — transfers are between accounts sharing a currency.`
            : "Pick a source first"
        }
      />

      <DateField
        value={data.date}
        onChange={(date) => setData((prev) => ({ ...prev, date }))}
      />

      {/* Savings-goal linkage — offered once a destination the goals can hold money in is chosen */}
      {eligibleGoals.length > 0 && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="transfer-credit-goal"
              checked={creditGoal}
              onCheckedChange={(checked) => handleCreditGoalChange(checked === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="transfer-credit-goal"
              className="cursor-pointer text-sm font-medium leading-snug text-foreground"
            >
              <PiggyBank className="mr-1 inline h-4 w-4 text-muted-foreground" />
              Also count this toward a savings goal
            </Label>
          </div>

          {creditGoal && eligibleGoals.length > 1 && (
            <Select
              value={data.savingGoalId ?? ""}
              onValueChange={(value) => setData({ ...data, savingGoalId: value })}
            >
              <SelectTrigger className="h-11 border-border bg-background">
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent>
                {eligibleGoals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id ?? ""}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {creditGoal && eligibleGoals.length === 1 && (
            <p className="text-xs text-muted-foreground">
              Counts toward <span className="font-medium">{eligibleGoals[0].title}</span>.
            </p>
          )}
        </div>
      )}

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="transfer-note" className="text-sm font-medium text-foreground">
          Note
          <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="transfer-note"
          value={data.note ?? ""}
          onChange={(e) => setData({ ...data, note: e.target.value })}
          placeholder="e.g., Monthly savings top-up"
          className="min-h-20 resize-none border-border bg-background transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </FormShell>
  );
}
