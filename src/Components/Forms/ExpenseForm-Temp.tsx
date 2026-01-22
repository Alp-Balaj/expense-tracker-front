"use client";

import React, { useMemo, useState } from "react";
import type { Expense, ExpenseFormProps } from "@/Models/Expense";
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
import { Calendar, DollarSign, FileText, Tag, Wallet } from "lucide-react";

export default function ExpenseFormTEST({
  row,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const initial: Expense = useMemo(
    () => ({
      id: row?.id ?? null,
      title: row?.title ?? "",
      amount: row?.amount ?? 0,
      date: row?.date ? new Date(row.date) : new Date(),
      description: row?.description ?? "",
      accountId: row?.accountId ?? "",
      categoryId: row?.categoryId ?? "",
    }),
    [row]
  );

  const [data, setData] = useState<Expense>(initial);

  React.useEffect(() => {
    setData(initial);
  }, [initial]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(data);
  };

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

  // Sample data - replace with your actual data from API
  const accounts = [
    { id: "1", name: "Checking Account" },
    { id: "2", name: "Savings Account" },
    { id: "3", name: "Credit Card" },
  ];

  const categories = [
    { id: "1", name: "Food & Dining" },
    { id: "2", name: "Transportation" },
    { id: "3", name: "Shopping" },
    { id: "4", name: "Utilities" },
    { id: "5", name: "Entertainment" },
  ];

  return (
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
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder="e.g., Grocery shopping"
            className="pl-10 h-11 border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Amount and Date Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="amount"
            className="text-sm font-medium text-foreground"
          >
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
                setData({ ...data, amount: toNumber(e.target.value) })
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
              onChange={(e) => setData({ ...data, date: toDate(e.target.value) })}
              className="pl-10 h-11 border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Account and Category Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="account"
            className="text-sm font-medium text-foreground"
          >
            Account
          </Label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Select
              value={data.accountId}
              onValueChange={(value) => setData({ ...data, accountId: value })}
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
          <Label
            htmlFor="category"
            className="text-sm font-medium text-foreground"
          >
            Category
          </Label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Select
              value={data.categoryId}
              onValueChange={(value) => setData({ ...data, categoryId: value })}
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
        <Label
          htmlFor="description"
          className="text-sm font-medium text-foreground"
        >
          Description
          <span className="text-muted-foreground font-normal ml-1">
            (optional)
          </span>
        </Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          placeholder="Add any additional details about this expense..."
          className="min-h-24 resize-none border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
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
  );
}
