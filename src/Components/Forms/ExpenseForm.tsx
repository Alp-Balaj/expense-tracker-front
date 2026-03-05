import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Calendar, DollarSign, FileText, Tag, Wallet } from "lucide-react";

import type { Expense as ModelExpense } from "@/Models/Expense";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import type { Account } from "@/Models/Account";
import type { Category } from "@/Models/Category";
import type { AxiosError } from "axios";
import { CategoryType } from "@/Enums/enums";

type FormState = Omit<ModelExpense, "date"> & { date: Date };

export interface ExpenseFormModalProps {
  row?: ModelExpense | null;
  onSubmit: (data: ModelExpense) => void;

  open: boolean;
  onOpenChange: (open: boolean) => void;

  onCancel?: () => void;
}

export default function ExpenseFormModal({
  row,
  onSubmit,
  open,
  onOpenChange,
  onCancel,
}: ExpenseFormModalProps) {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData } = useAuthorizationApi();

  // #region Accounts and Categories for dropdown
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accountLoadError, setAccountLoadError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    setAccountLoadError(null);
    try {
      const data = await getAllData<Account[]>("api/Account");
      setAccounts(data);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        setAccountLoadError("Failed to load accounts.");
        console.error(accountLoadError);
      }
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [getAllData]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryLoadError, setCategoryLoadError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setCategoryLoadError(null);
    try {
      const data = await getAllData<Category[]>("api/Category");
      const expenseCategories = data.filter(
              (a) => a.categoryType === CategoryType.Expense,
            );
      setCategories(expenseCategories);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        setCategoryLoadError("Failed to load categories.");
        console.error(categoryLoadError);
      }
    } finally {
      setIsLoadingCategories(false);
    }
  }, [getAllData]);
  //#endregion

  const normalizeDate = (value: unknown) => {
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") {
      const d = new Date(value);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  };

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
      date: normalizeDate((row as ModelExpense)?.date ?? new Date()),
    }),
    [row]
  );

  const [data, setData] = useState<FormState>(initial);

  React.useEffect(() => {
    setData(initial);
    if (!isAuthReady || !accessToken) return;
    if(!isLoadingCategories)
      fetchCategories();
    if(!isLoadingAccounts)
      fetchAccounts();
  }, [fetchCategories, fetchAccounts, initial, isAuthReady, accessToken]);

  const toNumber = (value: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const toDate = (value: string) => new Date(`${value}T00:00:00`);

  const toDateInputValue = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: ModelExpense = {
      ...(data as ModelExpense),
      date: (data.date.toISOString() as unknown) as Date,
    };

    onSubmit(payload);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{row ? "Edit Expense" : "Add New Expense"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-foreground">
              Title
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value } as FormState)}
                placeholder="e.g., Grocery shopping"
                className="pl-10 h-11 border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Amount and Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                Amount
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.amount}
                  onChange={(e) =>
                    setData({ ...data, amount: toNumber(e.target.value) } as FormState)
                  }
                  placeholder="0.00"
                  className="pl-10 h-11 border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium text-foreground">
                Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={toDateInputValue(data.date)}
                  onChange={(e) =>
                    setData({ ...data, date: toDate(e.target.value) } as FormState)
                  }
                  className="pl-10 h-11 border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Account and Category Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account" className="text-sm font-medium text-foreground">
                Account
              </Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={data.accountId}
                  onValueChange={(value) =>
                    setData({ ...data, accountId: value } as FormState)
                  }
                >
                  <SelectTrigger className="pl-10 h-11 border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                    <SelectValue placeholder="Select account" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-foreground">
                Category
              </Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={data.categoryId}
                  onValueChange={(value) =>
                    setData({ ...data, categoryId: value } as FormState)
                  }
                >
                  <SelectTrigger className="pl-10 h-11 border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                    <SelectValue placeholder="Select category" />
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
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={(data.description ?? "") as string}
              onChange={(e) =>
                setData({ ...data, description: e.target.value } as FormState)
              }
              placeholder="Add any additional details about this expense..."
              className="min-h-24 resize-none border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-6 h-11 border-border hover:bg-muted transition-colors bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {row ? "Update Expense" : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}