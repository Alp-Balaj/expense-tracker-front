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
import { SplitBillField } from "@/Components/Forms/shared/SplitBillField";

import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";
import { useExpensesQuery } from "@/Hooks/queries/useExpenses";
import { useQueuedCreateExpense } from "@/Hooks/useQueuedExpense";
import { CategoryType } from "@/Enums/enums";
import { todayISO } from "@/lib/dates";
import { getApiErrorMessage } from "@/lib/errors";
import { currencySymbol } from "@/lib/identity";
import {
  buildMerchantIndex,
  lastUsedAccountId,
  rankCategoriesByUsage,
  suggestMerchants,
  type MerchantEntry,
} from "@/lib/quickAdd";
import type { Expense } from "@/Models/Expense";

type Draft = Omit<Expense, "id">;

const emptyDraft = (): Draft => ({
  title: "",
  amount: 0,
  date: todayISO(),
  description: "",
  accountId: "",
  categoryId: "",
  // Split bills are the exception, and a split is never inherited by the next
  // entry — see the reset in handleSubmit.
  expectedReimbursement: null,
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
  // Stream O: the same call online, a queued one when the network is not
  // there. /add is the write path an offline outbox exists for — it is the
  // screen people open in a shop.
  const createExpense = useQueuedCreateExpense();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  // Merchant memory: typing in the title matches previous expense titles;
  // picking one refills its usual category and typical amount.
  const merchantIndex = React.useMemo(() => buildMerchantIndex(expenses), [expenses]);
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);
  const suggestions = React.useMemo(
    () => (suggestionsOpen ? suggestMerchants(merchantIndex, data.title) : []),
    [suggestionsOpen, merchantIndex, data.title]
  );

  const applySuggestion = (entry: MerchantEntry) => {
    setSuggestionsOpen(false);
    setData((d) => ({
      ...d,
      title: entry.title,
      // The usual category always follows the merchant; the typical amount
      // only fills in when nothing was typed yet (amount-first flow wins).
      categoryId: entry.categoryId || d.categoryId,
      amount: d.amount > 0 ? d.amount : entry.amount,
    }));
  };

  // The split block only ever reports a receivable inside (0, amount); this is
  // a belt-and-braces guard so an impossible one can never reach the server.
  const splitValid =
    data.expectedReimbursement == null ||
    (data.expectedReimbursement > 0 && data.expectedReimbursement < data.amount);

  const canSubmit =
    data.amount > 0 &&
    data.categoryId !== "" &&
    data.accountId !== "" &&
    splitValid;

  const close = () => navigate(-1);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    const { expectedReimbursement, ...rest } = data;

    const payload: Expense = {
      id: null,
      ...rest,
      // Optional title: derive from the category when left empty.
      title: data.title.trim() || selectedCategory?.name || "Expense",
      // Absent, not zero, when this is not a split — an unsplit expense has to
      // look exactly the way it did before splits existed.
      ...(expectedReimbursement != null ? { expectedReimbursement } : {}),
    };

    let outcome: "sent" | "queued";
    setIsSubmitting(true);
    try {
      outcome = await createExpense(payload);
    } catch (err) {
      // The server was reached and refused it: a queue would only fail again.
      toast.error(getApiErrorMessage(err, "Failed to add expense."));
      return; // keep the draft so nothing typed is lost
    } finally {
      setIsSubmitting(false);
    }

    toast.success(
      outcome === "queued"
        ? "Saved on this device — it will sync when you're back online"
        : "Expense added"
    );
    // Reset for the next entry, keeping the picked account and date —
    // logging several receipts in a row shouldn't repeat those taps. The
    // split is deliberately NOT kept: it belongs to the one bill.
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
      submitDisabled={!canSubmit || isSubmitting}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[550px]"
    >
      <AmountField
        value={data.amount}
        onChange={(amount) => setData((d) => ({ ...d, amount }))}
        currencySymbol={currencySymbol(selectedAccount?.currencyCode)}
        autoFocus
      />

      <SplitBillField
        amount={data.amount}
        value={data.expectedReimbursement}
        onChange={(expectedReimbursement) =>
          setData((d) => ({ ...d, expectedReimbursement }))
        }
        currencySymbol={currencySymbol(selectedAccount?.currencyCode)}
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
            onChange={(e) => {
              setSuggestionsOpen(true);
              setData((d) => ({ ...d, title: e.target.value }));
            }}
            onFocus={() => setSuggestionsOpen(true)}
            onBlur={() => setSuggestionsOpen(false)}
            placeholder={selectedCategory ? selectedCategory.name : "e.g., Grocery shopping"}
            autoComplete="off"
            className="h-11 pl-10"
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-controls="merchant-suggestions"
            aria-autocomplete="list"
          />
          {suggestions.length > 0 && (
            <ul
              id="merchant-suggestions"
              role="listbox"
              aria-label="Previous titles"
              className="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-md"
            >
              {suggestions.map((entry) => {
                const usualCategory = categories.find(
                  (c) => c.id === entry.categoryId
                );
                return (
                  <li key={entry.title.toLowerCase()}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      // Runs before the input's blur closes the list.
                      onPointerDown={(e) => {
                        e.preventDefault();
                        applySuggestion(entry);
                      }}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent"
                    >
                      <span className="truncate font-medium">{entry.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {usualCategory ? `${usualCategory.name} · ` : ""}
                        {currencySymbol(selectedAccount?.currencyCode)}
                        {entry.amount.toFixed(2)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
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
