import { useState } from "react";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/Components/ui/button";
import { Calendar } from "@/Components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import { Checkbox } from "@/Components/ui/checkbox";
import { Label } from "@/Components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/Components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { TransactionReportRequest } from "@/Models/Report";
import type { Category } from "@/Models/Category";
import type { Account } from "@/Models/Account";
import { CategoryType } from "@/Enums/enums";

interface TransactionReportFiltersProps {
  accounts: Account[];
  categories: Category[];
  onGenerateReport: (filters: TransactionReportRequest) => void;
  isLoading?: boolean;
}

export function TransactionReportFilters({
  accounts,
  categories,
  onGenerateReport,
  isLoading = false,
}: TransactionReportFiltersProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeIncomes, setIncludeIncomes] = useState(true);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAllAccounts = () => {
    if (selectedAccountIds.length === accounts.length) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(accounts.map((a) => a.id));
    }
  };

  const handleSelectAllCategories = () => {
    if (selectedCategoryIds.length === categories.length) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(categories.map((c) => c.id));
    }
  };

  const handleGenerateReport = () => {
    if (!fromDate || !toDate) return;

    const filters: TransactionReportRequest = {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      accountIds: selectedAccountIds.length > 0 ? selectedAccountIds : undefined,
      categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      includeExpenses,
      includeIncomes,
    };

    onGenerateReport(filters);
  };

  const handleClearFilters = () => {
    setFromDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setToDate(new Date());
    setSelectedAccountIds([]);
    setSelectedCategoryIds([]);
    setIncludeExpenses(true);
    setIncludeIncomes(true);
  };

  const expenseCategories = categories.filter((c) => c.categoryType === CategoryType.Expense);
  const incomeCategories = categories.filter((c) => c.categoryType === CategoryType.Income);

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Report Filters</h3>
      </div>

      {/* Date Range */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>From Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !fromDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fromDate ? format(fromDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={setFromDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>To Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !toDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {toDate ? format(toDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={toDate}
                onSelect={setToDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Transaction Types */}
      <div className="space-y-3">
        <Label>Transaction Types</Label>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeExpenses"
              checked={includeExpenses}
              onCheckedChange={(checked) => setIncludeExpenses(checked === true)}
            />
            <Label
              htmlFor="includeExpenses"
              className="text-sm font-normal cursor-pointer"
            >
              Include Expenses
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeIncomes"
              checked={includeIncomes}
              onCheckedChange={(checked) => setIncludeIncomes(checked === true)}
            />
            <Label
              htmlFor="includeIncomes"
              className="text-sm font-normal cursor-pointer"
            >
              Include Incomes
            </Label>
          </div>
        </div>
      </div>

      {/* Accounts Filter */}
      <Collapsible open={isAccountsOpen} onOpenChange={setIsAccountsOpen}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Accounts</Label>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                {isAccountsOpen ? "Hide" : "Show"}{" "}
                {selectedAccountIds.length > 0 &&
                  `(${selectedAccountIds.length} selected)`}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-2">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs text-muted-foreground">
                Leave empty to include all accounts
              </span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={handleSelectAllAccounts}
              >
                {selectedAccountIds.length === accounts.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`account-${account.id}`}
                    checked={selectedAccountIds.includes(account.id)}
                    onCheckedChange={() => handleAccountToggle(account.id)}
                  />
                  <Label
                    htmlFor={`account-${account.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {account.name}
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Categories Filter */}
      <Collapsible open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Categories</Label>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                {isCategoriesOpen ? "Hide" : "Show"}{" "}
                {selectedCategoryIds.length > 0 &&
                  `(${selectedCategoryIds.length} selected)`}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs text-muted-foreground">
                Leave empty to include all categories
              </span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={handleSelectAllCategories}
              >
                {selectedCategoryIds.length === categories.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            {expenseCategories.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-destructive">
                  Expense Categories
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {expenseCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategoryIds.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incomeCategories.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-success">
                  Income Categories
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {incomeCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategoryIds.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button
          onClick={handleGenerateReport}
          disabled={!fromDate || !toDate || isLoading}
          className="flex-1"
        >
          {isLoading ? "Generating..." : "Generate Report"}
        </Button>
        <Button variant="outline" onClick={handleClearFilters} className="sm:w-auto bg-transparent">
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
