import React, { useMemo, useState } from "react";
import { FileText } from "lucide-react";

import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { FormShell } from "@/Components/Forms/shared/FormShell";
import { AmountField } from "@/Components/Forms/shared/AmountField";
import { currencySymbol } from "@/lib/identity";
import { ChipPicker } from "@/Components/Forms/shared/ChipPicker";
import { DateField } from "@/Components/Forms/shared/DateField";

import { CategoryType, PlannedKind, Recurrence } from "@/Enums/enums";
import type { PlannedTransaction } from "@/Models/PlannedTransaction";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";
import { useSavingGoalsQuery } from "@/Hooks/queries/useSavingGoals";
import { accountRoles, describeRecurrence } from "@/lib/planned";
import { todayISO, toISODate } from "@/lib/dates";

/** The submit path maps this sentinel to null; a cleared chip maps back to it. */
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
 * is why "One-off" sits in the same chip row as "Monthly" rather than behind a
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

  const primaryAccount = accounts.find(
    (a) => a.id === (roles.from ? data.fromAccountId : data.toAccountId),
  );

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

  const accountChips = (
    label: string,
    value: string,
    onChange: (next: string) => void,
  ) => (
    <ChipPicker
      label={label}
      items={[
        { id: "", label: "Ask me each time" },
        ...accounts.map((a) => ({ id: a.id, label: a.name })),
      ]}
      value={value}
      onChange={onChange}
    />
  );

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      onCancel={onCancel}
      title={row ? "Edit plan" : "New planned transaction"}
      description="Nothing is ever posted automatically. When this comes due it waits in your queue until you confirm what actually happened."
      submitLabel={row ? "Update plan" : "Save plan"}
      submitDisabled={
        submitting ||
        !data.title.trim() ||
        data.amount <= 0 ||
        needsCategory ||
        sameAccount ||
        endsBeforeStart
      }
      onSubmit={handleSubmit}
      desktopClassName="max-h-[90vh] overflow-y-auto sm:max-w-[540px]"
    >
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
              className={`h-9 rounded-full border text-sm transition-colors ${
                data.kind === option.value
                  ? "border-primary bg-primary/15 font-medium text-primary"
                  : "border-border text-foreground/80 hover:bg-accent hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <AmountField
          id="planned-amount"
          label="Expected amount"
          value={data.amount}
          onChange={(amount) => setData({ ...data, amount })}
          currencySymbol={currencySymbol(primaryAccount?.currencyCode)}
          autoFocus={!row}
        />
        <p className="text-center text-xs text-muted-foreground">
          A starting point. You can change it every time you confirm, which is
          what a bill that varies needs.
        </p>
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

      {!isTransfer && (
        <ChipPicker
          label="Category"
          items={categories.map((c) => ({
            id: c.id,
            label: c.name,
            color: c.color,
          }))}
          value={data.categoryId}
          onChange={(categoryId) => setData({ ...data, categoryId })}
          emptyHint={`No ${
            data.kind === PlannedKind.Income ? "income" : "expense"
          } categories yet — add one under Categories & Currencies first.`}
        />
      )}

      {roles.from &&
        accountChips(
          isTransfer ? "From account" : "Usually paid from",
          data.fromAccountId,
          (v) => setData({ ...data, fromAccountId: v }),
        )}

      {roles.to &&
        accountChips(
          isTransfer ? "To account" : "Usually paid into",
          data.toAccountId,
          (v) => setData({ ...data, toAccountId: v, savingGoalId: NO_GOAL }),
        )}

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
        <ChipPicker
          label="Counts towards"
          optionalTag
          items={[
            { id: NO_GOAL, label: "No savings goal" },
            ...eligibleGoals.map((goal) => ({
              id: goal.id as string,
              label: goal.title,
            })),
          ]}
          value={data.savingGoalId}
          // Un-tapping a goal chip yields "", which must submit as "no goal".
          onChange={(v) => setData({ ...data, savingGoalId: v || NO_GOAL })}
        />
      )}

      <ChipPicker
        label="Repeats"
        items={RECURRENCE_OPTIONS.map((option) => ({
          id: String(option.value),
          label: option.label,
        }))}
        value={String(data.recurrence)}
        // Re-tapping the selected chip yields ""; a plan always repeats somehow,
        // so ignore it rather than let Number("") turn into a real enum value.
        onChange={(v) => {
          if (v) setData({ ...data, recurrence: Number(v) as Recurrence });
        }}
      />

      <DateField
        label={data.recurrence === Recurrence.Once ? "Due on" : "Starting"}
        value={data.startDate}
        onChange={(startDate) => setData({ ...data, startDate })}
      />

      {data.recurrence !== Recurrence.Once && (
        <DateField
          label="Until"
          optional
          clearLabel="No end date"
          value={data.endDate}
          onChange={(endDate) => setData({ ...data, endDate })}
        />
      )}

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
    </FormShell>
  );
}
