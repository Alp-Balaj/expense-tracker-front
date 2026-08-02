import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { FormShell } from "@/Components/Forms/shared/FormShell";
import { ChipPicker } from "@/Components/Forms/shared/ChipPicker";
import type { AddAccount } from "@/Models/Account";
import { AmountType } from "@/Enums/enums";
import { useCurrenciesQuery } from "@/Hooks/queries/useCurrencies";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AddAccount | null;
  onSave: (account: AddAccount) => void;
  defaultType?: AmountType;
}

const accountTypes: { value: AmountType; label: string }[] = [
  { value: AmountType.CheckingAccount, label: "Checking" },
  { value: AmountType.Cash, label: "Cash" },
  { value: AmountType.SavingsAccount, label: "Savings" },
  { value: AmountType.CreditCard, label: "Credit card" },
  { value: AmountType.Investment, label: "Investment" },
];

export function AccountForm({
  open,
  onOpenChange,
  account,
  onSave,
  defaultType = AmountType.CheckingAccount,
}: AddAccountDialogProps) {
  const navigate = useNavigate();

  const { data: currencies = [], isLoading: isLoadingCurrencies, isError: currenciesFailed } = useCurrenciesQuery();
  const currencyLoadError = currenciesFailed ? "Failed to load currencies." : null;

  const [name, setName] = useState("");
  const [amountType, setAmountType] = useState<AmountType>(defaultType);
  const [balance, setBalance] = useState(0);

  const toNumber = (value: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const [currencyId, setCurrencyId] = useState("");
  const [description, setDescription] = useState<string>("");

  const isEditing = !!account;

  useEffect(() => {
    if (account) {
      setName(account.name);
      setAmountType(account.amountType);
      setBalance(account.balance);
      setCurrencyId(account.currencyId);
      setDescription(account.description);
    } else {
      setName("");
      setAmountType(defaultType);
      setBalance(0);
      setCurrencyId("");
      setDescription("");
    }
  }, [account, defaultType]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({
      id: account?.id || null,
      name,
      amountType,
      balance,
      currencyId,
      description,
    });
    onOpenChange(false);
  };

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Account" : "Add New Account"}
      description={
        isEditing
          ? "Update your account details below."
          : "Create a new account to track your finances."
      }
      submitLabel={isEditing ? "Save Changes" : "Create Account"}
      submitDisabled={!name.trim()}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[425px]"
    >
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Account Name
        </Label>
        <Input
          id="name"
          placeholder="e.g., Main Checking"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11"
        />
      </div>

      <ChipPicker
        label="Type"
        items={accountTypes.map((t) => ({
          id: String(t.value),
          label: t.label,
        }))}
        value={String(amountType)}
        onChange={(id) => {
          // Type is required: ignore the picker's tap-again deselect.
          if (id !== "") setAmountType(Number(id) as AmountType);
        }}
      />

      <div className="space-y-2">
        <Label htmlFor="balance" className="text-sm font-medium">
          Initial Balance
        </Label>
        <Input
          id="balance"
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0.00"
          value={balance}
          onChange={(e) => setBalance(toNumber(e.target.value))}
          className="h-11"
        />
      </div>

      <ChipPicker
        label="Currency"
        items={currencies.map((c) => ({
          id: c.id ?? "",
          label: c.symbol ? `${c.code} ${c.symbol}` : c.code,
        }))}
        value={currencyId}
        onChange={setCurrencyId}
        onAddNew={() => {
          onOpenChange(false);
          navigate("/categoryAndCurrency");
        }}
        addNewLabel="New currency"
        emptyHint={
          isLoadingCurrencies ? "Loading currencies..." : "No currencies yet."
        }
        error={currencyLoadError}
      />

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Weekly grocery shopping expenses"
          rows={2}
        />
      </div>
    </FormShell>
  );
}
