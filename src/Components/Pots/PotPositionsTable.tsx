import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { formatPosition, formatPotAmount } from "@/lib/potMoney";
import { cn } from "@/lib/utils";
import type { PotLedger } from "@/Models/Pot";

export interface PotPositionsTableProps {
  ledger: PotLedger;
}

/**
 * Where every member stands, and the arithmetic that got them there.
 *
 * <h3>The terms are shown, not just the answer</h3>
 * "You are €12.40 down" is only trustworthy next to the four numbers behind it,
 * and this is a group of people who are going to disagree with it out loud at
 * some point. Put in, fronted, used, taken out — then the position. Disputes
 * are settled by talking, and this is what they talk about.
 *
 * <h3>The total is the whole promise</h3>
 * The footer adds the positions up and states that the sum is the pot's
 * balance. It is not decoration: it is the invariant this wave was built
 * around, put where a member can check it rather than only a test.
 */
export default function PotPositionsTable({ ledger }: PotPositionsTableProps) {
  const total = ledger.positions.reduce((sum, p) => sum + p.position, 0);
  const anyFronted = ledger.positions.some((p) => p.outOfPocket !== 0);
  const anyWithdrawn = ledger.positions.some((p) => p.withdrawn !== 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Positions</CardTitle>
        <CardDescription>
          What everyone put in, what they used, and what is still theirs. All in{" "}
          {ledger.currencyCode}.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="-mx-6 overflow-x-auto px-6">
          <table className="w-full min-w-[26rem] text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="py-2 pr-3 text-left font-medium">
                  Member
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Put in
                </th>
                {anyFronted && (
                  <th scope="col" className="py-2 pr-3 text-right font-medium">
                    Fronted
                  </th>
                )}
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Used
                </th>
                {anyWithdrawn && (
                  <th scope="col" className="py-2 pr-3 text-right font-medium">
                    Took out
                  </th>
                )}
                <th scope="col" className="py-2 text-right font-medium">
                  Position
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {ledger.positions.map((p) => (
                <tr key={p.membershipId} className={cn(!p.isActive && "text-muted-foreground")}>
                  <th scope="row" className="py-2 pr-3 text-left font-normal">
                    <span className={cn("text-foreground", !p.isActive && "text-muted-foreground")}>
                      {p.displayName}
                    </span>
                    {p.isYou && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                    {!p.isActive && (
                      <span className="ml-1.5 text-xs text-muted-foreground">· left</span>
                    )}
                  </th>

                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatPotAmount(p.toppedUp, ledger.currencyCode)}
                  </td>

                  {anyFronted && (
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {formatPotAmount(p.outOfPocket, ledger.currencyCode)}
                    </td>
                  )}

                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatPotAmount(p.shares, ledger.currencyCode)}
                  </td>

                  {anyWithdrawn && (
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {formatPotAmount(p.withdrawn, ledger.currencyCode)}
                    </td>
                  )}

                  <td
                    className={cn(
                      "py-2 text-right font-medium tabular-nums",
                      p.position > 0 && "text-emerald-600 dark:text-emerald-400",
                      p.position < 0 && "text-destructive",
                    )}
                  >
                    {formatPosition(p.position, ledger.currencyCode)}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="border-t-2 border-border">
                <th scope="row" className="py-2 pr-3 text-left font-medium text-foreground">
                  In the pot
                </th>
                <td
                  className="py-2 text-right font-semibold tabular-nums text-foreground"
                  colSpan={2 + (anyFronted ? 1 : 0) + (anyWithdrawn ? 1 : 0)}
                >
                  {formatPotAmount(total, ledger.currencyCode)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="pt-3 text-xs text-muted-foreground">
          Everyone's position adds up to what is in the pot — always, after every change.
        </p>
      </CardContent>
    </Card>
  );
}
