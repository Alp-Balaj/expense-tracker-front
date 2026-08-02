import { useState, useEffect } from "react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { FormShell } from "@/Components/Forms/shared/FormShell";
import type { Currency } from "@/Models/Currency";

interface CurrencyEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: Currency | null;
  /** The user's base currency from preferences — the labels used to hardcode EUR. */
  baseCode: string;
  onSave: (currency: Currency) => void;
}

export function CurrencyForm({
  open,
  onOpenChange,
  currency,
  baseCode,
  onSave,
}: CurrencyEditDialogProps) {
  const [code, setCode] = useState("");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [exchangeRate, setExchangeRate] = useState("1");

  const isEditing = !!currency;

  useEffect(() => {
    if (currency) {
      setCode(currency.code);
      setSymbol(currency.symbol);
      setName(currency.name);
      setExchangeRate(currency.exchangeRateToBase.toString());
    } else {
      setCode("");
      setSymbol("");
      setName("");
      setExchangeRate("1");
    }
  }, [currency]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({
      id: currency?.id || null,
      code: code.toUpperCase(),
      symbol,
      name,
      exchangeRateToBase: parseFloat(exchangeRate) || 1,
    });
    onOpenChange(false);
  };

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Currency" : "New Currency"}
      description={
        isEditing
          ? "Update the currency details below."
          : "Add a new currency to track exchange rates."
      }
      submitLabel={isEditing ? "Save Changes" : "Add Currency"}
      submitDisabled={!code.trim() || !symbol.trim() || !name?.trim()}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[425px]"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm font-medium">
            Code
          </Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.slice(0, 3))}
            placeholder="USD"
            maxLength={3}
            className="h-11 uppercase"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="symbol" className="text-sm font-medium">
            Symbol
          </Label>
          <Input
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.slice(0, 3))}
            placeholder="$"
            maxLength={3}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="US Dollar"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rate" className="text-sm font-medium">
          Exchange Rate to {baseCode}
        </Label>
        <div className="relative">
          <Input
            id="rate"
            type="number"
            inputMode="decimal"
            step="0.0001"
            min="0"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            placeholder="1.0000"
            className="h-11 pr-16"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {baseCode} per {code || "unit"}
          </span>
        </div>
        {/* This label used to say the exact opposite ("How many X equal 1 EUR"),
            which is the inverse of what the backend stores and what the rate
            fetcher writes. */}
        <p className="text-xs text-muted-foreground">
          How many {baseCode} one {code || "unit"} is worth. Rates for major
          currencies refresh automatically — enter one by hand only for
          currencies the daily update doesn't cover.
        </p>
      </div>
    </FormShell>
  );
}
