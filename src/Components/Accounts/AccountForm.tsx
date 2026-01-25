import { useCallback, useEffect } from "react"
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
import type { AddAccount } from "@/Models/Account";
import { AmountType } from "@/Enums/enums";
import type { CurrencyDropdown } from "@/Models/Currency";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import type { AxiosError } from "axios";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AddAccount | null;
  onSave: (account: AddAccount) => void;
  defaultType?: AmountType;
}

export function AccountForm({
  open,
  onOpenChange,
  account,
  onSave,
  defaultType = AmountType.CheckingAccount,
}: AddAccountDialogProps) {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData } = useAuthorizationApi();


  const [currencies, setCurrencies] = useState<CurrencyDropdown[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [currencyLoadError, setCurrencyLoadError] = useState<string | null>(null);

  const fetchCurrencies = useCallback(async () => {
    setIsLoadingCurrencies(true);
    setCurrencyLoadError(null);

    try {
      const data = await getAllData<CurrencyDropdown[]>("api/Currency");
      setCurrencies(data);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        setCurrencyLoadError("Failed to load currencies.");
        console.error(err);
      }
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [getAllData]);

  const [name, setName] = useState("");
  const [amountType, setAmountType] = useState<AmountType>(defaultType);
  const [balance, setBalance] = useState(0);
  const [balanceCurrencyId, setBalanceCurrencyId] = useState("");
  const [description, setDescription] = useState<string>("");

  const isEditing = !!account;

  useEffect(() => {
    if (!isAuthReady || !accessToken) return;
    if(!isLoadingCurrencies)
        fetchCurrencies();

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
                onValueChange={setBalanceCurrencyId}
                disabled={isLoadingCurrencies || !!currencyLoadError}
              >
                <SelectTrigger className="w-full" id="currency">
                  <SelectValue
                    placeholder={
                      isLoadingCurrencies
                        ? "Loading currencies..."
                        : currencyLoadError
                        ? "Failed to load"
                        : "Select currency"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {currencyLoadError && (
                <p className="text-sm text-destructive">{currencyLoadError}</p>
              )}
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