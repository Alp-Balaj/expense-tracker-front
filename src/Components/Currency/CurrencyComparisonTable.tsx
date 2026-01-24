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
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

interface CurrencyComparisonTableProps {
  currencies: Currency[];
  baseAmount?: number;
}

export function CurrencyComparisonTable({
  currencies,
  baseAmount = 100,
}: CurrencyComparisonTableProps) {

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Currency Comparison
          <span className="text-sm font-normal text-muted-foreground">
            (Base: EUR)
          </span>
        </CardTitle>
        <CardDescription>
          How {baseAmount} EUR compares to other currencies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Currency</TableHead>
              <TableHead className="text-center">Rate</TableHead>
              <TableHead className="text-right">
                {baseAmount} EUR =
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies
              .filter((c) => c.code !== "EUR")
              .map((currency) => {
                const convertedAmount = baseAmount * currency.exchangeRateToBase;
                const isStronger = currency.exchangeRateToBase < 1;

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
