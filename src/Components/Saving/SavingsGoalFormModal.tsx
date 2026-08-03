import React, { useMemo, useState } from "react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { FormShell } from "@/Components/Forms/shared/FormShell";
import { AmountField } from "@/Components/Forms/shared/AmountField";
import { currencySymbol } from "@/lib/identity";
import { ChipPicker } from "@/Components/Forms/shared/ChipPicker";
import { DateField } from "@/Components/Forms/shared/DateField";
import { FileText, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { SavingGoals, AddSavingsGoal } from "@/Models/SavingGoals";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";
import { CategoryType } from "@/Enums/enums";
import { toISODate } from "@/lib/dates";

export interface SavingsGoalFormModalProps {
  row?: SavingGoals | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddSavingsGoal) => void | Promise<void>;
  onCancel?: () => void;
}

type FormState = {
  id: string | null;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  description: string;
  accountId: string;
  categoryId: string;
};

export default function SavingsGoalFormModal({
  row,
  open,
  onOpenChange,
  onSubmit,
  onCancel,
}: SavingsGoalFormModalProps) {
  const navigate = useNavigate();

  const { data: accounts = [] } = useAccountsQuery();
  const { data: allCategories = [] } = useCategoriesQuery();
  const categories = useMemo(
    () => allCategories.filter((c) => c.categoryType === CategoryType.Savings),
    [allCategories]
  );

  const initial: FormState = useMemo(
    () => ({
      id: row?.id ?? null,
      title: row?.title ?? "",
      targetAmount: row?.targetAmount ?? 0,
      savedAmount: row?.savedAmount ?? 0,
      // toISODate falls back to today, so the required deadline is never empty.
      deadline: toISODate(row?.deadline),
      description: row?.description ?? "",
      accountId: row?.accountId ?? "",
      categoryId: row?.categoryId ?? "",
    }),
    [row],
  );

  const [data, setData] = useState<FormState>(initial);

  React.useEffect(() => {
    setData(initial);
  }, [open, initial]);

  const toNumber = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: AddSavingsGoal = {
      id: data.id,
      title: data.title,
      targetAmount: data.targetAmount,
      savedAmount: data.savedAmount,
      deadline: data.deadline,
      description: data.description,
      // Optional since Stream V: nothing about the goal's money depends on it.
      accountId: data.accountId || null,
      categoryId: data.categoryId,
    };
    try {
      await onSubmit(payload);
    } catch {
      return; // error toast shown by the submit handler; keep the dialog open
    }
    onOpenChange(false);
  };

  // Filter for Savings categories (CategoryType.Savings = 2)
  const savingsCategories = categories.filter((c) => c.categoryType === 2);

  const selectedAccount = accounts.find((a) => a.id === data.accountId);

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      onCancel={onCancel}
      title={row ? "Edit Savings Goal" : "New Savings Goal"}
      submitLabel={row ? "Update Goal" : "Save Goal"}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[550px]"
    >
      <AmountField
        id="goal-target"
        label="Money goal"
        value={data.targetAmount}
        onChange={(targetAmount) => setData({ ...data, targetAmount })}
        currencySymbol={currencySymbol(selectedAccount?.currencyCode)}
        autoFocus={!row}
      />

      {/* Title */}
      <div className="space-y-2">
        <Label
          htmlFor="goal-title"
          className="text-sm font-medium text-foreground"
        >
          My goal is
        </Label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="goal-title"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder="e.g., Emergency fund, Vacation"
            className="pl-10 h-11 border-border bg-background"
            required
          />
        </div>
      </div>

      {/* Deadline (required by the backend; toISODate guarantees a value) */}
      <DateField
        label="Deadline"
        value={data.deadline}
        onChange={(deadline) => setData({ ...data, deadline })}
      />

      {/* Initial Saved Amount (only on create) */}
      {!row && (
        <div className="space-y-2">
          <Label
            htmlFor="goal-saved"
            className="text-sm font-medium text-foreground"
          >
            Already saved
            <span className="text-muted-foreground font-normal ml-1">
              (optional)
            </span>
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="goal-saved"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={data.savedAmount || ""}
              onChange={(e) =>
                setData({ ...data, savedAmount: toNumber(e.target.value) })
              }
              placeholder="0.00"
              className="pl-10 h-11 border-border bg-background"
            />
          </div>
        </div>
      )}

      {/*
        The goal itself holds no money — each contribution names the account it
        is reserved against, and one goal can span several. This picker only
        pre-selects the account the first contribution form suggests, so it is
        optional and binds nothing.
      */}
      <div className="space-y-1.5">
        <ChipPicker
          label="Where you expect to keep this money"
          items={accounts.map((a) => ({ id: a.id, label: a.name }))}
          value={data.accountId}
          onChange={(accountId) => setData({ ...data, accountId })}
          onAddNew={() => {
            onOpenChange(false);
            navigate("/account");
          }}
          addNewLabel="New account"
          emptyHint="No accounts yet."
          optionalTag
        />
        <p className="text-xs text-muted-foreground">
          Just a suggestion for your first contribution — you can save toward
          this goal from any account.
        </p>
      </div>

      <ChipPicker
        label="Category"
        items={(savingsCategories.length > 0
          ? savingsCategories
          : categories
        ).map((c) => ({ id: c.id, label: c.name, color: c.color }))}
        value={data.categoryId}
        onChange={(categoryId) => setData({ ...data, categoryId })}
        onAddNew={() => {
          onOpenChange(false);
          navigate("/categoryAndCurrency");
        }}
        addNewLabel="New category"
        emptyHint="No savings categories yet."
      />

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Description
          <span className="text-muted-foreground font-normal ml-1">
            (optional)
          </span>
        </Label>
        <Textarea
          value={data.description}
          onChange={(e) =>
            setData({ ...data, description: e.target.value })
          }
          placeholder="Why is this goal important to you?"
          className="min-h-20 resize-none border-border bg-background"
        />
      </div>
    </FormShell>
  );
}
