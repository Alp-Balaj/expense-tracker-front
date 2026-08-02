import React, { useMemo, useState } from "react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { FormShell } from "@/Components/Forms/shared/FormShell";
import { AmountField } from "@/Components/Forms/shared/AmountField";
import { currencySymbol } from "@/lib/identity";
import { ChipPicker } from "@/Components/Forms/shared/ChipPicker";

import type { AddBudget, Budget } from "@/Models/Budget";
import { BudgetPeriod } from "@/Models/Budget";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";
import { CategoryType } from "@/Enums/enums";
import { useCurrency } from "@/Hooks/useCurrency";

/**
 * Sentinel for the overall budget — the empty string already means "nothing
 * picked yet" (and keeps submit disabled), so "overall" needs its own value.
 */
const OVERALL = "__overall__";

export interface BudgetFormModalProps {
  row?: Budget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddBudget) => void | Promise<void>;
  onCancel?: () => void;
  /** Categories already budgeted; offered only when editing that same budget. */
  takenCategoryIds?: (string | null)[];
}

export default function BudgetFormModal({
  row,
  open,
  onOpenChange,
  onSubmit,
  onCancel,
  takenCategoryIds = [],
}: BudgetFormModalProps) {
  const navigate = useNavigate();
  const { userCurrencyCode } = useCurrency();
  const { data: allCategories = [] } = useCategoriesQuery();

  const expenseCategories = useMemo(
    () => allCategories.filter((c) => c.categoryType === CategoryType.Expense),
    [allCategories]
  );

  // A category can hold one budget, so hide the ones already spoken for —
  // except the row being edited, which must stay selectable.
  const availableCategories = useMemo(
    () =>
      expenseCategories.filter(
        (c) => c.id === row?.categoryId || !takenCategoryIds.includes(c.id)
      ),
    [expenseCategories, takenCategoryIds, row]
  );

  const overallTaken = takenCategoryIds.includes(null) && row?.categoryId !== null;

  const initial = useMemo(
    () => ({
      id: row?.id ?? null,
      amount: row?.amount ?? 0,
      note: row?.note ?? "",
      categoryId: row ? (row.categoryId ?? OVERALL) : "",
    }),
    [row]
  );

  const [data, setData] = useState(initial);

  // Reset the fields whenever the dialog opens or switches rows. Adjusting
  // state during render (React's documented pattern) rather than in an effect
  // keeps it to a single render pass instead of a visible stale-value flash.
  const formKey = `${open}:${row?.id ?? "new"}`;
  const [lastFormKey, setLastFormKey] = useState(formKey);
  if (formKey !== lastFormKey) {
    setLastFormKey(formKey);
    setData(initial);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: AddBudget = {
      id: data.id,
      amount: data.amount,
      period: BudgetPeriod.Monthly,
      note: data.note.trim() ? data.note.trim() : null,
      categoryId: data.categoryId === OVERALL ? null : data.categoryId,
    };

    try {
      await onSubmit(payload);
    } catch {
      return; // error toast shown by the submit handler; keep the dialog open
    }
    onOpenChange(false);
  };

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      onCancel={onCancel}
      title={row ? "Edit budget" : "New monthly budget"}
      description={`A budget repeats every month until you change it. Amounts are in your base currency (${userCurrencyCode}).`}
      submitLabel={row ? "Update budget" : "Save budget"}
      submitDisabled={!data.categoryId || data.amount <= 0}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[500px]"
    >
      <AmountField
        label="Monthly limit"
        value={data.amount}
        onChange={(amount) => setData((prev) => ({ ...prev, amount }))}
        currencySymbol={currencySymbol(userCurrencyCode)}
        autoFocus={!row}
      />

      {/* The category decides which budget row this is; changing it on an
          existing budget is what the "already budgeted" rule guards. */}
      <div className={row ? "pointer-events-none opacity-60" : undefined}>
        <ChipPicker
          label="Applies to"
          items={[
            ...(!overallTaken
              ? [{ id: OVERALL, label: "All expenses (overall)" }]
              : []),
            ...availableCategories.map((c) => ({
              id: c.id,
              label: c.name,
              color: c.color,
            })),
          ]}
          value={data.categoryId}
          onChange={(categoryId) => {
            if (!row) setData((prev) => ({ ...prev, categoryId }));
          }}
          onAddNew={() => {
            onOpenChange(false);
            navigate("/categoryAndCurrency");
          }}
          addNewLabel="New category"
          emptyHint="Every expense category already has a budget."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget-note" className="text-sm font-medium text-foreground">
          Note
          <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
        </Label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="budget-note"
            value={data.note}
            onChange={(e) => setData({ ...data, note: e.target.value })}
            placeholder="e.g., includes household supplies"
            maxLength={200}
            className="h-11 border-border bg-background pl-10"
          />
        </div>
      </div>
    </FormShell>
  );
}
