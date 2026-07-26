import React, { useMemo, useState } from "react";
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
import { Calendar, DollarSign, FileText, PlusCircle, Tag, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Income as ModelIncome } from "@/Models/Income";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";
import { CategoryType } from "@/Enums/enums";
import { toISODate } from "@/lib/dates";
import { Spinner } from "../ui/spinner";

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

  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccountsQuery();
  const { data: allCategories = [], isLoading: isLoadingCategories } = useCategoriesQuery();
  const categories = useMemo(
    () => allCategories.filter((c) => c.categoryType === CategoryType.Income),
    [allCategories]
  );

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
    [row],
  );

  const [data, setData] = useState<FormState>(initial);

  React.useEffect(() => {
    setData(initial);
  }, [open, initial]);

  const toNumber = (value: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await onSubmit(data);
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{row ? "Edit Income" : "Add New Income"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label
              htmlFor="income-title"
              className="text-sm font-medium text-foreground"
            >
              Title
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="income-title"
                value={data.title}
                onChange={(e) =>
                  setData({ ...data, title: e.target.value } as FormState)
                }
                placeholder="e.g., Monthly salary"
                className="pl-10 h-11 border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="income-amount"
                className="text-sm font-medium text-foreground"
              >
                Amount
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="income-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.amount}
                  onChange={(e) =>
                    setData({
                      ...data,
                      amount: toNumber(e.target.value),
                    } as FormState)
                  }
                  placeholder="0.00"
                  className="pl-10 h-11 border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="income-date"
                className="text-sm font-medium text-foreground"
              >
                Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="income-date"
                  type="date"
                  value={data.date}
                  onChange={(e) =>
                    setData({
                      ...data,
                      date: e.target.value,
                    } as FormState)
                  }
                  className="pl-10 h-11 border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Account + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="income-account"
                className="text-sm font-medium text-foreground"
              >
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
                    {isLoadingAccounts && <Spinner />}
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                    <div className="border-t mt-1 pt-1">
                      <button
                        type="button"
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-primary hover:bg-accent rounded-sm cursor-pointer"
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => { onOpenChange(false); navigate("/account"); }}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Add new account
                      </button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="income-category"
                className="text-sm font-medium text-foreground"
              >
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
                    {isLoadingCategories && <Spinner />}
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <div className="border-t mt-1 pt-1">
                      <button
                        type="button"
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-primary hover:bg-accent rounded-sm cursor-pointer"
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => { onOpenChange(false); navigate("/categoryAndCurrency"); }}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Add new category
                      </button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="income-description"
              className="text-sm font-medium text-foreground"
            >
              Description
              <span className="text-muted-foreground font-normal ml-1">
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
              className="min-h-24 resize-none border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Actions */}
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
              {row ? "Update Income" : "Add Income"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
