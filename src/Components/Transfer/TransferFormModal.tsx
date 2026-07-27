import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Calendar, DollarSign, PiggyBank, PlusCircle, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
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
import { Spinner } from "@/Components/ui/spinner";

import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useSavingGoalsQuery } from "@/Hooks/queries/useSavingGoals";
import { emptyTransfer, type Transfer } from "@/Models/Transfer";
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

  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccountsQuery();
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

  // A goal's saved amount tracks money in the account behind it, so only goals
  // backed by the destination can be credited by this transfer.
  const eligibleGoals = useMemo(
    () => goals.filter((g) => g.accountId === data.toAccountId),
    [goals, data.toAccountId],
  );

  // Repointing the destination can invalidate both the chosen destination
  // (currency) and the chosen goal (backing account); drop them rather than
  // submitting a combination the API will refuse.
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
    const stillEligible = goals.some((g) => g.accountId === toAccountId && g.id === data.savingGoalId);
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

  const toNumber = (value: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
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

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const canSubmit =
    !!data.fromAccountId &&
    !!data.toAccountId &&
    data.amount > 0 &&
    (!creditGoal || !!data.savingGoalId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{row ? "Edit Transfer" : "Transfer Between Accounts"}</DialogTitle>
          <DialogDescription>
            Moving your own money — this does not count as income or expense.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* From + To */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="transfer-from" className="text-sm font-medium text-foreground">
                From
              </Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Select value={data.fromAccountId} onValueChange={handleSourceChange}>
                  <SelectTrigger
                    id="transfer-from"
                    className="h-11 border-border bg-background pl-10 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAccounts && <Spinner />}
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.currencyCode})
                      </SelectItem>
                    ))}
                    <div className="mt-1 border-t pt-1">
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent"
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onOpenChange(false);
                          navigate("/account");
                        }}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Add new account
                      </button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ArrowRight className="mx-auto hidden h-4 w-4 shrink-0 text-muted-foreground sm:mb-4 sm:block" />

            <div className="space-y-2">
              <Label htmlFor="transfer-to" className="text-sm font-medium text-foreground">
                To
              </Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Select
                  value={data.toAccountId}
                  onValueChange={handleDestinationChange}
                  disabled={!data.fromAccountId}
                >
                  <SelectTrigger
                    id="transfer-to"
                    className="h-11 border-border bg-background pl-10 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <SelectValue
                      placeholder={data.fromAccountId ? "Select account" : "Pick a source first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.currencyCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {data.fromAccountId && destinations.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No other {source?.currencyCode} account yet — transfers are between accounts
                  sharing a currency.
                </p>
              )}
            </div>
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-amount" className="text-sm font-medium text-foreground">
                Amount
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="transfer-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={data.amount || ""}
                  onChange={(e) => setData({ ...data, amount: toNumber(e.target.value) })}
                  placeholder="0.00"
                  className="h-11 border-border bg-background pl-10 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-date" className="text-sm font-medium text-foreground">
                Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="transfer-date"
                  type="date"
                  value={data.date}
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                  className="h-11 border-border bg-background pl-10 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Savings-goal linkage — only offered when the destination backs a goal */}
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="h-11 border-border bg-transparent px-6 transition-colors hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-11 bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {row ? "Update Transfer" : "Transfer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
