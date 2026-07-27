import { Link } from "react-router-dom";

import { useCurrency } from "@/Hooks/useCurrency";
import { splitAmountParts } from "@/lib/dashboard";
import type { NavIndicators } from "./useNavIndicators";

/**
 * The money block under the sidebar's brand: what is left to spend this month,
 * the same figure the dashboard hero leads with. It sits in the nav so the
 * number is on screen on every page, not only the dashboard.
 */
export function NavBudgetBlock({ indicators }: { indicators: NavIndicators }) {
  const { format, userCurrencyCode } = useCurrency();
  const { overallBudget: budget, cursor, monthLabel, isLoading } = indicators;

  const money = (amount: number) => format(amount, userCurrencyCode);

  if (isLoading) {
    return (
      <div className="animate-pulse border-b border-sidebar-border bg-primary-soft px-5 pt-4 pb-[18px]">
        <div className="h-2.5 w-24 rounded bg-foreground/10" />
        <div className="mt-2.5 h-7 w-32 rounded bg-foreground/10" />
        <div className="mt-3 h-1.5 rounded-full bg-foreground/10" />
        <div className="mt-2 h-2.5 w-full rounded bg-foreground/10" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="border-b border-sidebar-border bg-primary-soft px-5 pt-4 pb-[18px]">
        <div className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-primary-strong">
          No budget for {monthLabel}
        </div>
        <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
          Set a monthly budget to see what&apos;s safe to spend.
        </p>
        <Link
          to="/budgets"
          className="mt-2.5 inline-flex text-xs font-semibold text-primary hover:underline"
        >
          Set a budget →
        </Link>
      </div>
    );
  }

  const overspent = budget.remaining < 0;
  const { lead, fraction, trail } = splitAmountParts(money(Math.abs(budget.remaining)));

  return (
    <div className="border-b border-sidebar-border bg-primary-soft px-5 pt-4 pb-[18px]">
      <div className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-primary-strong">
        {overspent ? "Over budget" : "Safe to spend"}
      </div>

      <div className="mt-1.5 text-[30px] leading-[1.05] font-bold tracking-[-0.02em] tabular-nums text-foreground">
        {overspent && "−"}
        {lead}
        <span className="text-foreground/35">
          {fraction}
          {trail}
        </span>
      </div>

      <div className="relative mt-3 h-1.5 rounded-full bg-card">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
            overspent ? "bg-destructive" : "bg-primary"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, budget.percentUsed))}%` }}
        />
        {/* Where the month itself has got to — spending should trail this. */}
        <div
          className="absolute -top-[3px] -bottom-[3px] w-0.5 bg-foreground"
          style={{ left: `${Math.min(100, cursor.elapsed * 100)}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-[7px] flex justify-between font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
        <span>{Math.round(budget.percentUsed)}% used</span>
        <span>
          {cursor.daysLeft} {cursor.daysLeft === 1 ? "day" : "days"} left
        </span>
      </div>
    </div>
  );
}
