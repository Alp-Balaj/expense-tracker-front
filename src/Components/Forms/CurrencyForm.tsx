import { useState, useEffect } from "react";
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
import type { Currency } from "@/Models/Currency";

interface CurrencyEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: Currency | null;
  onSave: (currency: Currency) => void;
}

export function CurrencyForm({
  open,
  onOpenChange,
  currency,
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

  const handleSave = () => {
    onSave({
      id: currency?.id || crypto.randomUUID(),
      code: code.toUpperCase(),
      symbol,
      name,
      exchangeRateToBase: parseFloat(exchangeRate) || 1,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Currency" : "New Currency"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the currency details below."
              : "Add a new currency to track exchange rates."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.slice(0, 3))}
                placeholder="USD"
                maxLength={3}
                className="uppercase"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.slice(0, 3))}
                placeholder="$"
                maxLength={3}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="US Dollar"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rate">Exchange Rate to EUR</Label>
            <div className="relative">
              <Input
                id="rate"
                type="number"
                step="0.0001"
                min="0"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="1.0000"
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                per EUR
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              How many {code || "units"} equal 1 EUR
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!code.trim() || !symbol.trim() || !name.trim()}
          >
            {isEditing ? "Save Changes" : "Add Currency"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}