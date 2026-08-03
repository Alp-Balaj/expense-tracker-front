import { useMemo } from "react";
import { Panel, PanelHeader } from "@/Components/Dashboard/Panel";
import type { Expense } from "@/Models/Expense";
import type { Reimbursement } from "@/Models/Reimbursement";
import { useCurrency } from "@/Hooks/useCurrency";
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
 */
export function OwedToMe({ reimbursements, expenses, isLoading, className }: OwedToMeProps) {
  const { format, userCurrencyCode } = useCurrency();

  const rows = useMemo(
    () => [...reimbursements].sort((a, b) => b.daysOpen - a.daysOpen),
    [reimbursements],
  );

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
            className="flex items-center gap-3 border-t border-border py-2.5"
          >
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-foreground">
              {receivable.expenseTitle}
            </span>
            <span className="shrink-0 text-[13.5px] font-semibold tabular-nums text-foreground">
              {money(receivable.openAmount)}
            </span>
            <span className="w-16 shrink-0 text-right font-mono text-[11px] uppercase text-muted-foreground">
              · {receivable.daysOpen}d open
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
