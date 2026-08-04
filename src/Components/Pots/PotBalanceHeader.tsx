import { ArrowDownToLine, ArrowUpFromLine, Receipt, TriangleAlert } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { formatPosition, formatPotAmount } from "@/lib/potMoney";
import { cn } from "@/lib/utils";
import type { PotLedger } from "@/Models/Pot";

export interface PotBalanceHeaderProps {
  ledger: PotLedger;
  onTopUp: () => void;
  onLogExpense: () => void;
  onWithdraw: () => void;
}

/**
 * What is in the pot, where you stand against it, and the three things you can
 * do about either.
 *
 * <h3>Two numbers, and they are not the same question</h3>
 * The balance is a fact about the pot; the position is a fact about you. A
 * member with €80 in a pot holding €50 is not looking at an error — somebody
 * else has consumed more than they put in, and the arithmetic is saying so.
 * Showing only one of the two is what makes pot apps confusing, so both are
 * here, labelled, side by side.
 *
 * <h3>Everything is in the pot's currency</h3>
 * No conversion, anywhere on this screen. Every member sees the same figures,
 * which is the point — four members converting one bill into four base
 * currencies would be four different numbers for one dinner.
 */
export default function PotBalanceHeader({
  ledger,
  onTopUp,
  onLogExpense,
  onWithdraw,
}: PotBalanceHeaderProps) {
  const you = ledger.positions.find((p) => p.isYou);
  const position = you?.position ?? 0;
  const withdrawable = you?.withdrawable ?? 0;

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">In the pot</p>
            <p
              data-testid="pot-balance"
              className="text-3xl font-semibold tabular-nums tracking-[-0.02em] text-foreground"
            >
              {formatPotAmount(ledger.balance, ledger.currencyCode)}
            </p>
          </div>

          <div className="space-y-1 sm:text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Your position</p>
            <p
              data-testid="pot-your-position"
              className={cn(
                "text-2xl font-semibold tabular-nums tracking-[-0.02em]",
                position > 0 && "text-emerald-600 dark:text-emerald-400",
                position < 0 && "text-destructive",
                position === 0 && "text-foreground",
              )}
            >
              {formatPosition(position, ledger.currencyCode)}
            </p>
            <p className="text-xs text-muted-foreground">
              {position > 0
                ? "still yours in the pot"
                : position < 0
                  ? "you have used more than you put in"
                  : "square with the pot"}
            </p>
          </div>
        </div>

        {ledger.isLow && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400"
          >
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>This pot is running low. Anyone can add to it.</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onLogExpense} className="h-11 flex-1 sm:flex-none">
            <Receipt className="mr-2 h-4 w-4" />
            Log an expense
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onTopUp}
            className="h-11 flex-1 sm:flex-none"
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Add money
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onWithdraw}
            // Not hidden when there is nothing to take: a disabled control with
            // a reason is a smaller surprise than a button that comes and goes.
            disabled={withdrawable <= 0}
            title={
              withdrawable > 0
                ? undefined
                : "You have nothing in this pot to take out."
            }
            className="h-11 flex-1 sm:flex-none"
          >
            <ArrowUpFromLine className="mr-2 h-4 w-4" />
            Take out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
