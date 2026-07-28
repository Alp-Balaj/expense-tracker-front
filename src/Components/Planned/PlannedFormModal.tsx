import React, { useMemo, useState } from "react";
import { CalendarDays, FileText, Landmark, Repeat, Tag, Wallet } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
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

import { CategoryType, PlannedKind, Recurrence } from "@/Enums/enums";
import type { PlannedTransaction } from "@/Models/PlannedTransaction";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";
import { useSavingGoalsQuery } from "@/Hooks/queries/useSavingGoals";
import { accountRoles, describeRecurrence } from "@/lib/planned";
import { todayISO, toISODate } from "@/lib/dates";

/** Radix Select cannot hold an empty value, so "no goal" needs a sentinel. */
const NO_GOAL = "__none__";

const KIND_OPTIONS = [
  { value: PlannedKind.Expense, label: "Expense", hint: "Rent, a subscription, a bill" },
  { value: PlannedKind.Income, label: "Income", hint: "Salary, a recurring payment in" },
  { value: PlannedKind.Transfer, label: "Transfer", hint: "A standing order into savings" },
];

const RECURRENCE_OPTIONS = [
  { value: Recurrence.Once, label: "One-off" },
  { value: Recurrence.Weekly, label: "Weekly" },
  { value: Recurrence.Monthly, label: "Monthly" },
  { value: Recurrence.Yearly, label: "Yearly" },
];

export interface PlannedFormModalProps {
  row?: PlannedTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlannedTransaction) => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * Creating or editing a schedule.
 *
 * One form for both flavours: the recurrence field is the only thing that
 * decides whether this is a subscription or a single future-dated payment, which
 * is why "One-off" sits in the same dropdown as "Monthly" rather than behind a
 * separate button.
 *
 * The accounts are optional on purpose. They are defaults for the confirm
 * dialog, not commitments — leave one blank and it simply asks each time.
 */
export default function PlannedFormModal({
  row,
  open,
  onOpenChange,
  onSubmit,
  onCancel,
}: PlannedFormModalProps) {
  const { data: accounts = [] } = useAccountsQuery();
  const { data: allCategories = [] } = useCategoriesQuery();
  const { data: savingGoals = [] } = useSavingGoalsQuery();

  const initial = useMemo(
    () => ({
      id: row?.id ?? null,
      title: row?.title ?? "",
      amount: row?.amount ?? 0,
      description: row?.description ?? "",
      kind: row?.kind ?? PlannedKind.Expense,
      categoryId: row?.categoryId ?? "",
      fromAccountId: row?.fromAccountId ?? "",
      toAccountId: row?.toAccountId ?? "",
      savingGoalId: row?.savingGoalId ?? NO_GOAL,
      recurrence: row?.recurrence ?? Recurrence.Monthly,
      startDate: row ? toISODate(row.startDate) : todayISO(),
      endDate: row?.endDate ? toISODate(row.endDate) : "",
      isActive: row?.isActive ?? true,
    }),
    [row],
  );

  const [data, setData] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  const formKey = `${open}:${row?.id ?? "new"}`;
  const [lastFormKey, setLastFormKey] = useState(formKey);
  if (formKey !== lastFormKey) {
    setLastFormKey(formKey);
    setData(initial);
    setSubmitting(false);
  }

  const roles = accountRoles(data.kind);
  const isTransfer = data.kind === PlannedKind.Transfer;

  // A planned expense picks from Expense categories and a planned income from
  // Income ones — the same axes a hand-typed transaction uses, which is what
  // lets a confirmed one land in the budget you already have.
  const categories = useMemo(
    () =>
      allCategories.filter((c) =>
        data.kind === PlannedKind.Income
          ? c.categoryType === CategoryType.Income
          : c.categoryType === CategoryType.Expense,
      ),
    [allCategories, data.kind],
  );

  // Only goals backed by the destination account can be credited: the money has
  // to actually land in the account behind the goal.
  const eligibleGoals = useMemo(
    () => savingGoals.filter((g) => g.accountId === data.toAccountId),
    [savingGoals, data.toAccountId],
  );

  const handleKindChange = (kind: PlannedKind) => {
    setData((prev) => ({
      ...prev,
      kind,
      // Every one of these means something different under a new kind, and a
      // stale value would be rejected by the server rather than ignored.
      categoryId: "",
      fromAccountId: kind === PlannedKind.Income ? "" : prev.fromAccountId,
      toAccountId: kind === PlannedKind.Expense ? "" : prev.toAccountId,
      savingGoalId: NO_GOAL,
    }));
  };

  const sameAccount =
    isTransfer && Boolean(data.fromAccountId) && data.fromAccountId === data.toAccountId;
  const endsBeforeStart = Boolean(data.endDate) && data.endDate < data.startDate;
  const needsCategory = !isTransfer && !data.categoryId;

  const toNumber = (value: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const payload: PlannedTransaction = {
      id: data.id,
      title: data.title.trim(),
      amount: data.amount,
      description: data.description.trim() ? data.description.trim() : null,
      kind: data.kind,
      categoryId: isTransfer ? null : data.categoryId,
      fromAccountId: roles.from && data.fromAccountId ? data.fromAccountId : null,
      toAccountId: roles.to && data.toAccountId ? data.toAccountId : null,
      savingGoalId:
        isTransfer && data.savingGoalId !== NO_GOAL ? data.savingGoalId : null,
      recurrence: data.recurrence,
      startDate: data.startDate,
      endDate: data.endDate || null,
      isActive: data.isActive,
      // Server-computed; sent only to satisfy the type and ignored on the way in.
      nextDueDate: null,
      pendingCount: 0,
    };

    try {
      await onSubmit(payload);
    } catch {
      setSubmitting(false);
      return; // the page shows the error toast and keeps the dialog open
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const accountSelect = (
    id: string,
    value: string,
    onChange: (next: string) => void,
  ) => (
    <div className="relative">
      <Wallet className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-11 border-border bg-background pl-10">
          <SelectValue placeholder="Ask me each time" />
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{row ? "Edit plan" : "New planned transaction"}</DialogTitle>
          <DialogDescription>
            Nothing is ever posted automatically. When this comes due it waits in
            your queue until you confirm what actually happened.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {KIND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleKindChange(option.value)}
                  aria-pressed={data.kind === option.value}
                  title={option.hint}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    data.kind === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="planned-title" className="text-sm font-medium text-foreground">
              Name
            </Label>
            <Input
              id="planned-title"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder="Rent"
              maxLength={100}
              className="h-11 border-border bg-background"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="planned-amount" className="text-sm font-medium text-foreground">
              Expected amount
            </Label>
            <div className="relative">
              <Landmark className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="planned-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={data.amount || ""}
                onChange={(e) => setData({ ...data, amount: toNumber(e.target.value) })}
                placeholder="800.00"
                className="h-11 border-border bg-background pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A starting point. You can change it every time you confirm, which is
              what a bill that varies needs.
            </p>
          </div>

          {!isTransfer && (
            <div className="space-y-2">
              <Label htmlFor="planned-category" className="text-sm font-medium text-foreground">
                Category
              </Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Select
                  value={data.categoryId}
                  onValueChange={(v) => setData({ ...data, categoryId: v })}
                >
                  <SelectTrigger
                    id="planned-category"
                    className="h-11 border-border bg-background pl-10"
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {categories.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No {data.kind === PlannedKind.Income ? "income" : "expense"} categories
                  yet — add one under Categories &amp; Currencies first.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {roles.from && (
              <div className="space-y-2">
                <Label htmlFor="planned-from" className="text-sm font-medium text-foreground">
                  {isTransfer ? "From account" : "Usually paid from"}
                </Label>
                {accountSelect("planned-from", data.fromAccountId, (v) =>
                  setData({ ...data, fromAccountId: v }),
                )}
              </div>
            )}

            {roles.to && (
              <div className="space-y-2">
                <Label htmlFor="planned-to" className="text-sm font-medium text-foreground">
                  {isTransfer ? "To account" : "Usually paid into"}
                </Label>
                {accountSelect("planned-to", data.toAccountId, (v) =>
                  setData({ ...data, toAccountId: v, savingGoalId: NO_GOAL }),
                )}
              </div>
            )}
          </div>

          <p className="-mt-1 text-xs text-muted-foreground">
            Optional. Leave blank and you will be asked which account each time —
            useful for a bill you sometimes pay in cash.
          </p>

          {sameAccount && (
            <p role="alert" className="text-xs text-destructive">
              A transfer needs two different accounts.
            </p>
          )}

          {isTransfer && eligibleGoals.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="planned-goal" className="text-sm font-medium text-foreground">
                Counts towards
                <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Select
                value={data.savingGoalId}
                onValueChange={(v) => setData({ ...data, savingGoalId: v })}
              >
                <SelectTrigger id="planned-goal" className="h-11 border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_GOAL}>No savings goal</SelectItem>
                  {eligibleGoals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id as string}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="planned-recurrence" className="text-sm font-medium text-foreground">
              Repeats
            </Label>
            <div className="relative">
              <Repeat className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Select
                value={String(data.recurrence)}
                onValueChange={(v) => setData({ ...data, recurrence: Number(v) as Recurrence })}
              >
                <SelectTrigger
                  id="planned-recurrence"
                  className="h-11 border-border bg-background pl-10"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="planned-start" className="text-sm font-medium text-foreground">
                {data.recurrence === Recurrence.Once ? "Due on" : "Starting"}
              </Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="planned-start"
                  type="date"
                  value={data.startDate}
                  onChange={(e) => setData({ ...data, startDate: e.target.value })}
                  className="h-11 border-border bg-background pl-10"
                  required
                />
              </div>
            </div>

            {data.recurrence !== Recurrence.Once && (
              <div className="space-y-2">
                <Label htmlFor="planned-end" className="text-sm font-medium text-foreground">
                  Until
                  <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
                </Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="planned-end"
                    type="date"
                    value={data.endDate}
                    onChange={(e) => setData({ ...data, endDate: e.target.value })}
                    className="h-11 border-border bg-background pl-10"
                  />
                </div>
              </div>
            )}
          </div>

          {endsBeforeStart && (
            <p role="alert" className="text-xs text-destructive">
              The end date cannot be before the start date.
            </p>
          )}

          {/* Says back what was just built, in the same words the list uses. */}
          {data.recurrence !== Recurrence.Once && data.startDate && (
            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              {describeRecurrence(data.recurrence, data.startDate)}. Each one waits
              in your queue until you confirm it.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="planned-note" className="text-sm font-medium text-foreground">
              Note
              <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="planned-note"
                value={data.description}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                maxLength={500}
                className="h-11 border-border bg-background pl-10"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="h-11 border-border bg-transparent px-6 hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                !data.title.trim() ||
                data.amount <= 0 ||
                needsCategory ||
                sameAccount ||
                endsBeforeStart
              }
              className="h-11 px-6"
            >
              {row ? "Update plan" : "Save plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
