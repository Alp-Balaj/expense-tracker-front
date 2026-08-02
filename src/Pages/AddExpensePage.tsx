import * as React from "react";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { FormShell } from "@/Components/Forms/shared/FormShell";
import { AmountField } from "@/Components/Forms/shared/AmountField";
import { ChipPicker } from "@/Components/Forms/shared/ChipPicker";
import { DateField } from "@/Components/Forms/shared/DateField";

import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";
import { useCreateExpense, useExpensesQuery } from "@/Hooks/queries/useExpenses";
import { CategoryType } from "@/Enums/enums";
import { todayISO } from "@/lib/dates";
import { getApiErrorMessage } from "@/lib/errors";
import { currencySymbol } from "@/lib/identity";
import { lastUsedAccountId, rankCategoriesByUsage } from "@/lib/quickAdd";
import type { Expense } from "@/Models/Expense";

type Draft = Omit<Expense, "id">;

const emptyDraft = (): Draft => ({
  title: "",
  amount: 0,
  date: todayISO(),
  description: "",
  accountId: "",
  categoryId: "",
});

/**
 * /add — the phone-first quick-add screen the FAB opens. Amount first and
 * focused, category chips ranked by recent usage, account prefilled with the
 * last one used, date today: the common log is amount + one tap + submit.
 * Title is optional (falls back to the category name). After a successful
 * submit the form resets for the next entry; ✕ leaves. The classic
 * ExpenseForm modal stays untouched for edits and the desktop list page.
 */
export default function AddExpensePage() {
  const navigate = useNavigate();

  const { data: accounts = [], isError: accountsFailed } = useAccountsQuery();
  const { data: allCategories = [], isError: categoriesFailed } =
    useCategoriesQuery();
  const { data: expenses = [] } = useExpensesQuery();
  const createExpense = useCreateExpense();

  const categories = React.useMemo(
    () =>
      rankCategoriesByUsage(
        allCategories.filter((c) => c.categoryType === CategoryType.Expense),
        expenses
      ),
    [allCategories, expenses]
  );

  const [data, setData] = React.useState<Draft>(emptyDraft);
  // Set once the queries land; never re-applied after the user touches the
  // account chips (so deselecting doesn't snap back to the default).
  const [accountTouched, setAccountTouched] = React.useState(false);

  React.useEffect(() => {
    if (accountTouched || data.accountId) return;
    const preferred = lastUsedAccountId(expenses) || accounts[0]?.id || "";
    if (preferred) setData((d) => ({ ...d, accountId: preferred }));
  }, [accountTouched, data.accountId, expenses, accounts]);

  const selectedAccount = accounts.find((a) => a.id === data.accountId);
  const selectedCategory = categories.find((c) => c.id === data.categoryId);

  const canSubmit =
    data.amount > 0 && data.categoryId !== "" && data.accountId !== "";

  const close = () => navigate(-1);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload: Expense = {
      id: null,
      ...data,
      // Optional title: derive from the category when left empty.
      title: data.title.trim() || selectedCategory?.name || "Expense",
    };

    try {
      await createExpense.mutateAsync(payload);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to add expense."));
      return; // keep the draft so nothing typed is lost
    }

    toast.success("Expense added");
    // Reset for the next entry, keeping the picked account and date —
    // logging several receipts in a row shouldn't repeat those taps.
    setData((d) => ({ ...emptyDraft(), accountId: d.accountId, date: d.date }));
    document.getElementById("amount")?.focus();
  };

  return (
    <FormShell
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
      onCancel={close}
      title="Add Expense"
      description="Log a new expense"
      submitLabel="Add Expense"
      submitDisabled={!canSubmit || createExpense.isPending}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[550px]"
    >
      <AmountField
        value={data.amount}
        onChange={(amount) => setData((d) => ({ ...d, amount }))}
        currencySymbol={currencySymbol(selectedAccount?.currencyCode)}
        autoFocus
      />

      <ChipPicker
        label="Category"
        items={categories.map((c) => ({
          id: c.id,
          label: c.name,
          color: c.color,
        }))}
        value={data.categoryId}
        onChange={(categoryId) => setData((d) => ({ ...d, categoryId }))}
        emptyHint="No expense categories yet."
        error={categoriesFailed ? "Failed to load categories." : null}
      />

      <div className="space-y-2">
        <Label htmlFor="quick-title" className="text-sm font-medium">
          Title
          <span className="ml-1 font-normal text-muted-foreground">
            (optional)
          </span>
        </Label>
        <div className="relative">
          <FileText className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="quick-title"
            value={data.title}
            onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
            placeholder={selectedCategory ? selectedCategory.name : "e.g., Grocery shopping"}
            autoComplete="off"
            className="h-11 pl-10"
          />
        </div>
      </div>

      <ChipPicker
        label="Account"
        items={accounts.map((a) => ({ id: a.id, label: a.name }))}
        value={data.accountId}
        onChange={(accountId) => {
          setAccountTouched(true);
          setData((d) => ({ ...d, accountId }));
        }}
        emptyHint="No accounts yet."
        error={accountsFailed ? "Failed to load accounts." : null}
      />

      <DateField
        value={data.date}
        onChange={(date) => setData((d) => ({ ...d, date }))}
      />
    </FormShell>
  );
}
