import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import type { Currency } from "@/Models/Currency";
import { normalizeCode } from "@/lib/exchangeRates";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

interface CurrencyComparisonTableProps {
  currencies: Currency[];
  /** The user's base currency from preferences — this table used to assume EUR. */
  baseCode: string;
  baseAmount?: number;
}

export function CurrencyComparisonTable({
  currencies,
  baseCode,
  baseAmount = 100,
}: CurrencyComparisonTableProps) {
  const base = normalizeCode(baseCode);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Currency Comparison
          <span className="text-sm font-normal text-muted-foreground">
            (Base: {base})
          </span>
        </CardTitle>
        <CardDescription>
          How {baseAmount} {base} compares to other currencies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Currency</TableHead>
              <TableHead className="text-center">Rate</TableHead>
              <TableHead className="text-right">
                {baseAmount} {base} =
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies
              .filter((c) => normalizeCode(c.code) !== base)
              .filter((c) => Number.isFinite(c.exchangeRateToBase) && c.exchangeRateToBase > 0)
              .map((currency) => {
                // exchangeRateToBase converts INTO the base, so going the other way
                // — "what does 100 of my base buy?" — divides. The old code
                // multiplied, which was right only under the inverted convention
                // this suggestion removes.
                const convertedAmount = baseAmount / currency.exchangeRateToBase;
                const isStronger = currency.exchangeRateToBase > 1;

                return (
                  <TableRow key={currency.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{currency.symbol}</span>
                        <span className="text-muted-foreground">
                          {currency.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isStronger ? (
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className="font-mono text-sm">
                          {currency.exchangeRateToBase.toFixed(4)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono font-medium">
                          {currency.symbol}
                          {convertedAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
