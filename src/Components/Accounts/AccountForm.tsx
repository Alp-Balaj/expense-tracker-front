import React from "react"
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
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
import { Textarea } from "@/Components/ui/textarea";
import type { Account, AccountFormData } from "@/Models/Account";
import { AmountType } from "@/Enums/enums";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AccountFormData) => void;
  editingAccount?: Account | null;
}

const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CHF", label: "CHF - Swiss Franc" },
];

export function AccountForm({
  open,
  onOpenChange,
  onSubmit,
  editingAccount,
}: AddAccountDialogProps) {
  const [formData, setFormData] = useState<AccountFormData>({
    name: editingAccount?.name || "",
    amountType: editingAccount?.amountType || 0,
    balance: editingAccount?.balance || 0,
    balanceCurrencyId: editingAccount?.balanceCurrencyId || "USD",
    description: editingAccount?.description || "",
  });

  const [amountType, setAmountType] = useState<AmountType>(AmountType.CheckingAccount);
  const [errors, setErrors] = useState<Partial<Record<keyof AccountFormData, string>>>({});

  const resetForm = () => {
    if (editingAccount) {
      setFormData({
        name: editingAccount.name,
        amountType: editingAccount.amountType,
        balance: editingAccount.balance,
        balanceCurrencyId: editingAccount.balanceCurrencyId,
        description: editingAccount.description || "",
      });
    } else {
      setFormData({
        name: "",
        amountType: 0,
        balance: 0,
        balanceCurrencyId: "USD",
        description: "",
      });
    }
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AccountFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Account name is required";
    }

    if (formData.balance < 0 && formData.amountType !== 3) {
      newErrors.balance = "Balance cannot be negative for this account type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      resetForm();
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingAccount ? "Edit Account" : "Add New Account"}
          </DialogTitle>
          <DialogDescription>
            {editingAccount
              ? "Update your account details below."
              : "Create a new account to track your finances."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="e.g., Main Checking"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={String(amountType)} onValueChange={(v) => setAmountType(Number(v) as AmountType)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={String(AmountType.CheckingAccount)}>CheckingAccount</SelectItem>
                    <SelectItem value={String(AmountType.Cash)}>Cash</SelectItem>
                    <SelectItem value={String(AmountType.SavingsAccount)}>SavingsAccount</SelectItem>
                    <SelectItem value={String(AmountType.CreditCard)}>CreditCard</SelectItem>
                    <SelectItem value={String(AmountType.Investment)}>Investment</SelectItem>
                </SelectContent>
              </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Initial Balance</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.balance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    balance: parseFloat(e.target.value) || 0,
                  })
                }
              />
              {errors.balance && (
                <p className="text-sm text-destructive">{errors.balance}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.balanceCurrencyId}
                onValueChange={(value) =>
                  setFormData({ ...formData, balanceCurrencyId: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a note about this account..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingAccount ? "Save Changes" : "Add Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}