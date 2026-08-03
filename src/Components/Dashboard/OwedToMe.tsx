import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HandCoins } from "lucide-react";

import { Panel, PanelHeader } from "@/Components/Dashboard/Panel";
import { Button } from "@/Components/ui/button";
import SettleReimbursementDialog from "@/Components/Reimbursements/SettleReimbursementDialog";
import type { Expense } from "@/Models/Expense";
import type { Reimbursement, SettleReimbursement } from "@/Models/Reimbursement";
import { useCurrency } from "@/Hooks/useCurrency";
import { useSettleReimbursement } from "@/Hooks/queries/useReimbursements";
import { getApiErrorMessage } from "@/lib/errors";
import { frontedThisMonth, owedToMe, splitAmountParts } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface OwedToMeProps {
  /** Open receivables from GET /api/Reimbursement. */
  reimbursements: Reimbursement[];
  /** The full expense history — where the two totals are computed from. */
  expenses: Expense[];
  isLoading: boolean;
  /**
   * Grid placement, applied to the panel itself rather than to a wrapper —
   * a wrapper around nothing would still claim a slot and a gap on the days
   * this renders nothing.
   */
  className?: string;
}

/**
 * Money that left your account but was never yours to spend.
 *
 * <h3>It disappears when it is not true</h3>
 * Most people never split a bill, and a permanently empty "Owed to me €0.00"
 * card would be a worse dashboard for all of them. So this renders nothing at
 * all without receivables — including while the query is still in flight, since
 * a skeleton that resolves to nothing is just a flicker.
 *
 * <h3>Two numbers, because they answer different questions</h3>
 * What you fronted this month is about how much you have been carrying; what is
 * still out is about what you should chase. They are rarely the same figure and
 * the gap between them is the point of the sentence.
 *
 * <h3>Oldest first</h3>
 * The list is sorted by age rather than amount: a €12 debt from March is a
 * conversation you have been avoiding, and a €200 one from yesterday is not.
 *
 * <h3>Settled from where it is read</h3>
 * The panel is where you notice a debt, so it is also where you clear it —
 * otherwise noticing costs a trip to the Expenses page and a search for a row
 * you have just been shown. It opens the same dialog the list does, posts
 * through the same mutation, and reports failure the same way; the only thing
 * that differs is which screen you were standing on.
 */
export function OwedToMe({ reimbursements, expenses, isLoading, className }: OwedToMeProps) {
  const { format, userCurrencyCode } = useCurrency();

  // Which receivable the dialog is for; null closes it. The row can only offer
  // the settlement because it already holds the receivable — a settlement is
  // posted against its id, not the expense's.
  const [settling, setSettling] = useState<Reimbursement | null>(null);
  const settleReimbursement = useSettleReimbursement();

  const rows = useMemo(
    () => [...reimbursements].sort((a, b) => b.daysOpen - a.daysOpen),
    [reimbursements],
  );

  // The mutation invalidates both queries this panel is fed from — the
  // receivables it lists and the expenses its two totals are computed from — so
  // a settlement shrinks the row, and the last one takes the panel with it.
  const submitSettle = async (id: string, settlement: SettleReimbursement) => {
    try {
      await settleReimbursement.mutateAsync({ id, settlement });
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Settling failed."));
      throw e; // keeps the dialog open so the user can correct it
    }
    toast.success("Settlement recorded");
    setSettling(null);
  };

  if (isLoading || reimbursements.length === 0) return null;

  const money = (amount: number) => format(amount, userCurrencyCode);
  const stillOut = owedToMe(expenses);
  const fronted = frontedThisMonth(expenses);
  const { lead, fraction, trail } = splitAmountParts(money(stillOut));

  return (
    <Panel className={cn("p-5", className)} data-testid="owed-panel">
      <PanelHeader title="Owed to me" description="Open receivables on split bills" />

      <div
        data-testid="owed-total"
        className="mt-3.5 text-2xl font-bold tracking-tight tabular-nums text-foreground"
      >
        {lead}
        <span className="text-muted-foreground/60">
          {fraction}
          {trail}
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground" data-testid="owed-note">
        You fronted {money(fronted)} for others this month; {money(stillOut)} is still out.
      </p>

      <ul className="mt-3.5">
        {rows.map((receivable) => (
          <li
            key={receivable.id}
            data-testid="owed-row"
            className="flex items-center gap-2.5 border-t border-border py-1.5"
          >
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-foreground">
              {receivable.expenseTitle}
            </span>
            <span className="shrink-0 text-[13.5px] font-semibold tabular-nums text-foreground">
              {money(receivable.openAmount)}
            </span>
            {/* Natural width rather than the fixed column it used to hold: the
                settle control now needs those pixels more than the ages need to
                line up under each other. */}
            <span className="shrink-0 whitespace-nowrap font-mono text-[11px] uppercase text-muted-foreground">
              · {receivable.daysOpen}d open
            </span>
            {/*
              Icon-only, because the row already carries three pieces of text and
              a fourth would push the title into an ellipsis on a phone. What it
              settles is said in the accessible name instead of on screen — the
              rows look alike, so "Settle" alone would name every one of them the
              same thing.
            */}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
              aria-label={`Settle ${receivable.expenseTitle}, ${money(receivable.openAmount)} open`}
              onClick={() => setSettling(receivable)}
            >
              <HandCoins className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      <SettleReimbursementDialog
        reimbursement={settling}
        open={settling !== null}
        onOpenChange={(isOpen) => !isOpen && setSettling(null)}
        onSubmit={submitSettle}
      />
    </Panel>
  );
}
