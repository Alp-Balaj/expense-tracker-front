import { Plus, Trash2 } from "lucide-react";

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
import type { Account } from "@/Models/Account";
import type { Category } from "@/Models/Category";
import type { ImportMapping } from "@/Models/Import";

/**
 * Cultures offered for the decimal separator and the ambiguous `03/04/2026`.
 * A short list on purpose — this is the field that decides whether a German
 * statement imports as thousands or as cents, so it should be picked, not typed.
 */
const CULTURES = [
  { value: "en-US", label: "1,234.56 · MM/DD/YYYY (US)" },
  { value: "en-GB", label: "1,234.56 · DD/MM/YYYY (UK)" },
  { value: "de-DE", label: "1.234,56 · DD.MM.YYYY (DE/AT)" },
  { value: "fr-FR", label: "1 234,56 · DD/MM/YYYY (FR)" },
  { value: "nl-NL", label: "1.234,56 · DD-MM-YYYY (NL)" },
] as const;

/** Sentinel for "no column chosen" — Radix Select cannot hold an empty value. */
const NONE = "__none__";

interface ImportMappingFormProps {
  mapping: ImportMapping;
  columns: string[];
  accounts: Account[];
  categories: Category[];
  onChange: (next: ImportMapping) => void;
}

export function ImportMappingForm({
  mapping,
  columns,
  accounts,
  categories,
  onChange,
}: ImportMappingFormProps) {
  const set = <K extends keyof ImportMapping>(key: K, value: ImportMapping[K]) =>
    onChange({ ...mapping, [key]: value });

  const expenseCategories = categories.filter((c) => c.categoryType === 0);
  const incomeCategories = categories.filter((c) => c.categoryType === 1);

  const columnOptions = columns.map((label, index) => ({ label, value: String(index) }));

  const columnSelect = (
    id: string,
    label: string,
    value: number | null,
    onSelect: (index: number | null) => void,
    optional = false
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Select
        value={value === null || value < 0 ? NONE : String(value)}
        onValueChange={(v) => onSelect(v === NONE ? null : Number(v))}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Choose a column" />
        </SelectTrigger>
        <SelectContent>
          {optional && <SelectItem value={NONE}>None</SelectItem>}
          {columnOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="import-account" className="text-xs">
          Import into
        </Label>
        <Select value={mapping.accountId} onValueChange={(v) => set("accountId", v)}>
          <SelectTrigger id="import-account" className="w-full">
            <SelectValue placeholder="Choose an account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Every row lands here, and the account balance moves by the net of the file.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {columnSelect("import-date", "Date column", mapping.dateColumn, (i) =>
          set("dateColumn", i ?? -1)
        )}
        {columnSelect("import-amount", "Amount column", mapping.amountColumn, (i) =>
          set("amountColumn", i ?? -1)
        )}
        {columnSelect("import-description", "Description column", mapping.descriptionColumn, (i) =>
          set("descriptionColumn", i ?? -1)
        )}
        {columnSelect(
          "import-counterparty",
          "Payee column (optional)",
          mapping.counterpartyColumn,
          (i) => set("counterpartyColumn", i),
          true
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="import-culture" className="text-xs">
            Number and date format
          </Label>
          <Select value={mapping.culture} onValueChange={(v) => set("culture", v)}>
            <SelectTrigger id="import-culture" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CULTURES.map((culture) => (
                <SelectItem key={culture.value} value={culture.value}>
                  {culture.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="import-skip" className="text-xs">
            Lines to skip before the header
          </Label>
          <Input
            id="import-skip"
            type="number"
            min={0}
            max={50}
            value={mapping.skipRows}
            onChange={(e) => set("skipRows", Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-md border border-border p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mapping.hasHeaderRow}
            onChange={(e) => set("hasHeaderRow", e.target.checked)}
            className="size-4 accent-primary"
          />
          The first line is a header
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mapping.negativeIsExpense}
            onChange={(e) => set("negativeIsExpense", e.target.checked)}
            className="size-4 accent-primary"
          />
          Negative amounts are money leaving the account
        </label>
        <p className="pl-6 text-xs text-muted-foreground">
          Untick for exports that state withdrawals as positive numbers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="import-default-expense" className="text-xs">
            Default expense category
          </Label>
          <Select
            value={mapping.defaultExpenseCategoryId}
            onValueChange={(v) => set("defaultExpenseCategoryId", v)}
          >
            <SelectTrigger id="import-default-expense" className="w-full">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="import-default-income" className="text-xs">
            Default income category
          </Label>
          <Select
            value={mapping.defaultIncomeCategoryId}
            onValueChange={(v) => set("defaultIncomeCategoryId", v)}
          >
            <SelectTrigger id="import-default-income" className="w-full">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {incomeCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Anything the rules don't catch lands in the default category, which is
          the row the user re-buckets later — so the rules are a convenience,
          never a requirement. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Category rules</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              set("rules", [...mapping.rules, { contains: "", categoryId: "" }])
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add rule
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The first rule whose text appears in the description wins. "REWE" → Groceries.
        </p>

        {mapping.rules.map((rule, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              aria-label={`Rule ${index + 1} text`}
              placeholder="Text in the description"
              value={rule.contains}
              onChange={(e) => {
                const next = [...mapping.rules];
                next[index] = { ...rule, contains: e.target.value };
                set("rules", next);
              }}
            />
            <Select
              value={rule.categoryId}
              onValueChange={(v) => {
                const next = [...mapping.rules];
                next[index] = { ...rule, categoryId: v };
                set("rules", next);
              }}
            >
              <SelectTrigger aria-label={`Rule ${index + 1} category`} className="w-48 shrink-0">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove rule ${index + 1}`}
              onClick={() => set("rules", mapping.rules.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
