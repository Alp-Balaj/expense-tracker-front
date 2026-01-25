import { useEffect } from "react"
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
import type { Account } from "@/Models/Account";
import { AmountType } from "@/Enums/enums";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
  onSave: (account: Account) => void;
  defaultType?: AmountType;
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
  account,
  onSave,
  defaultType = AmountType.CheckingAccount,
}: AddAccountDialogProps) {
  const [name, setName] = useState("");
  const [amountType, setAmountType] = useState<AmountType>(defaultType);
  const [balance, setBalance] = useState(0);
  const [balanceCurrencyId, setBalanceCurrencyId] = useState("");
  const [description, setDescription] = useState<string>("");

  const isEditing = !!account;

  useEffect(() => {
    if (account) {
      setName(account.name);
      setAmountType(account.amountType);
      setBalance(account.balance);
      setBalanceCurrencyId(account.balanceCurrencyId);
      setDescription(account.description);
    } else {
      setName("");
      setAmountType(defaultType);
      setBalance(0);
      setBalanceCurrencyId("");
      setDescription("");
    }
  }, [account, defaultType]);

  const handleSave = () => {
    onSave({
      id: account?.id || null,
      name,
      amountType,
      balance,
      balanceCurrencyId,
      description,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Account" : "Add New Account"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your account details below."
              : "Create a new account to track your finances."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="e.g., Main Checking"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />
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
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={balanceCurrencyId}
                onValueChange={(value) =>
                  setBalanceCurrencyId(value)
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

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Weekly grocery shopping expenses"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {isEditing ? "Save Changes" : "Create Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}