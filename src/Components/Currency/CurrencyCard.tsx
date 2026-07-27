"use client";

import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import type { Currency } from "@/Models/Currency";
import { normalizeCode } from "@/lib/exchangeRates";
import { Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";

interface CurrencyCardProps {
  currency: Currency;
  /** The user's base currency from preferences — this card used to assume EUR. */
  baseCode: string;
  onEdit?: (currency: Currency) => void;
  onDelete?: (currency: Currency) => void;
}

export function CurrencyCard({ currency, baseCode, onEdit, onDelete }: CurrencyCardProps) {
  const base = normalizeCode(baseCode);
  const isBaseCurrency = normalizeCode(currency.code) === base;
  const rate = currency.exchangeRateToBase;
  const hasUsableRate = Number.isFinite(rate) && rate > 0;

  const rateDisplay = isBaseCurrency ? "Base" : hasUsableRate ? rate.toFixed(4) : "—";
  // rate > 1 means one unit of this currency buys more than one unit of the base,
  // so it is the stronger of the two. This read `< 1` back when the card assumed
  // the inverse rate direction.
  const isStronger = hasUsableRate && rate > 1;

  return (
    <Card className="border-border bg-card hover:bg-accent/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg">
              {currency.symbol}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{currency.code}</h3>
                {isBaseCurrency && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Base
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{currency.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                {!isBaseCurrency && hasUsableRate && (
                  isStronger ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )
                )}
                <span className="font-mono font-medium text-foreground">
                  {rateDisplay}
                </span>
              </div>
              {!isBaseCurrency && hasUsableRate && (
                <p className="text-xs text-muted-foreground">
                  1 {currency.code} = {rate.toFixed(4)} {base}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit?.(currency)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {!isBaseCurrency && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete?.(currency)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}