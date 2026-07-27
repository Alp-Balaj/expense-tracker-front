import React, { useMemo, useState } from "react";
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
import { PlusCircle, Tag, Target, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { AddBudget, Budget } from "@/Models/Budget";
import { BudgetPeriod } from "@/Models/Budget";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";
import { CategoryType } from "@/Enums/enums";
import { useCurrency } from "@/Hooks/useCurrency";

/** Sentinel for the overall budget — Radix Select cannot hold an empty value. */
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

  const toNumber = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

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

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{row ? "Edit budget" : "New monthly budget"}</DialogTitle>
          <DialogDescription>
            A budget repeats every month until you change it. Amounts are in your
            base currency ({userCurrencyCode}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Applies to</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Select
                value={data.categoryId}
                onValueChange={(v) => setData({ ...data, categoryId: v })}
                // The category decides which budget row this is; changing it on
                // an existing budget is what the "already budgeted" rule guards.
                disabled={Boolean(row)}
              >
                <SelectTrigger className="h-11 border-border bg-background pl-10">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {!overallTaken && (
                    <SelectItem value={OVERALL}>All expenses (overall)</SelectItem>
                  )}
                  {availableCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <div className="mt-1 border-t pt-1">
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onOpenChange(false);
                        navigate("/categoryAndCurrency");
                      }}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Add new category
                    </button>
                  </div>
                </SelectContent>
              </Select>
            </div>
            {!row && availableCategories.length === 0 && overallTaken && (
              <p className="text-xs text-muted-foreground">
                Every expense category already has a budget.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-amount" className="text-sm font-medium text-foreground">
              Monthly limit
            </Label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="budget-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={data.amount || ""}
                onChange={(e) => setData({ ...data, amount: toNumber(e.target.value) })}
                placeholder="300.00"
                className="h-11 border-border bg-background pl-10"
                required
              />
            </div>
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
              disabled={!data.categoryId || data.amount <= 0}
              className="h-11 px-6"
            >
              {row ? "Update budget" : "Save budget"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
