import React, { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { FormShell } from "@/Components/Forms/shared/FormShell";
import { AmountField } from "@/Components/Forms/shared/AmountField";
import { currencySymbol } from "@/lib/identity";
import { ChipPicker } from "@/Components/Forms/shared/ChipPicker";
import { DateField } from "@/Components/Forms/shared/DateField";

import type { Income as ModelIncome } from "@/Models/Income";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";
import { CategoryType } from "@/Enums/enums";
import { toISODate } from "@/lib/dates";

type FormState = ModelIncome;

export interface IncomeFormModalProps {
  row?: ModelIncome | null;
  onSubmit: (data: ModelIncome) => void | Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: () => void;
}

export default function IncomeFormModal({
  row,
  onSubmit,
  open,
  onOpenChange,
  onCancel,
}: IncomeFormModalProps) {
  const navigate = useNavigate();

  // #region Accounts and Categories for the chip pickers
  const { data: accounts = [], isError: accountsFailed } = useAccountsQuery();
  const { data: allCategories = [], isError: categoriesFailed } =
    useCategoriesQuery();
  const categories = useMemo(
    () => allCategories.filter((c) => c.categoryType === CategoryType.Income),
    [allCategories]
  );
  const accountLoadError = accountsFailed ? "Failed to load accounts." : null;
  const categoryLoadError = categoriesFailed
    ? "Failed to load categories."
    : null;
  //#endregion

  const initial: FormState = useMemo(
    () => ({
      ...(row ?? {
        id: null,
        title: "",
        amount: 0,
        description: "",
        accountId: "",
        categoryId: "",
      }),
      // Keep the date as a plain "yyyy-MM-dd" string; no Date round-trip.
      date: toISODate(row?.date),
    }),
    [row]
  );

  const [data, setData] = useState<FormState>(initial);

  React.useEffect(() => {
    setData(initial);
  }, [open, initial]);

  const selectedAccount = accounts.find((a) => a.id === data.accountId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await onSubmit(data);
    } catch {
      return; // error toast shown by the submit handler; keep the form open
    }
    onOpenChange(false);
  };

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      onCancel={onCancel}
      title={row ? "Edit Income" : "Add New Income"}
      submitLabel={row ? "Update Income" : "Add Income"}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[550px]"
    >
      <AmountField
        value={data.amount}
        onChange={(amount) => setData({ ...data, amount } as FormState)}
        currencySymbol={currencySymbol(selectedAccount?.currencyCode)}
        autoFocus={!row}
      />

      <div className="space-y-2">
        <Label htmlFor="income-title" className="text-sm font-medium">
          Title
        </Label>
        <div className="relative">
          <FileText className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="income-title"
            value={data.title}
            onChange={(e) =>
              setData({ ...data, title: e.target.value } as FormState)
            }
            placeholder="e.g., Monthly salary"
            className="h-11 pl-10"
          />
        </div>
      </div>

      <ChipPicker
        label="Category"
        items={categories.map((c) => ({
          id: c.id,
          label: c.name,
          color: c.color,
        }))}
        value={data.categoryId}
        onChange={(categoryId) =>
          setData({ ...data, categoryId } as FormState)
        }
        onAddNew={() => {
          onOpenChange(false);
          navigate("/categoryAndCurrency");
        }}
        addNewLabel="New category"
        emptyHint="No income categories yet."
        error={categoryLoadError}
      />

      <ChipPicker
        label="Account"
        items={accounts.map((a) => ({ id: a.id, label: a.name }))}
        value={data.accountId}
        onChange={(accountId) => setData({ ...data, accountId } as FormState)}
        onAddNew={() => {
          onOpenChange(false);
          navigate("/account");
        }}
        addNewLabel="New account"
        emptyHint="No accounts yet."
        error={accountLoadError}
      />

      <DateField
        value={data.date}
        onChange={(date) => setData({ ...data, date } as FormState)}
      />

      <div className="space-y-2">
        <Label htmlFor="income-description" className="text-sm font-medium">
          Description
          <span className="ml-1 font-normal text-muted-foreground">
            (optional)
          </span>
        </Label>
        <Textarea
          id="income-description"
          value={(data.description ?? "") as string}
          onChange={(e) =>
            setData({ ...data, description: e.target.value } as FormState)
          }
          placeholder="Add any additional details about this income..."
          className="min-h-20 resize-none"
        />
      </div>
    </FormShell>
  );
}
