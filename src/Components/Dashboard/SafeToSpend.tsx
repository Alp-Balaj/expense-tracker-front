import type * as React from "react";
import { Button } from "@/Components/ui/button";
import { Eyebrow } from "@/Components/Dashboard/Panel";
import { useCurrency } from "@/Hooks/useCurrency";
import { splitAmountParts, type LiquidPosition } from "@/lib/dashboard";

export interface SafeToSpendProps {
  /** "July" — the month the figures describe. */
  monthLabel: string;
  /** Days you can still spend on, today included. */
  daysLeft: number;
  /** 0..1 — where the pace marker sits on the bar. */
  elapsed: number;
  /** Null when no budget covers every category; the card then falls back to raw spend. */
  budget: { limit: number; spent: number; remaining: number; percentUsed: number } | null;
  spentThisMonth: number;
  netThisMonth: number;
  liquid: LiquidPosition;
  runwayDays: number | null;
  isLoading: boolean;
  onSetBudget: () => void;
}

/**
 * The one number the dashboard is built around: what is left to spend this
 * month. Everything else on the page is a supporting detail.
 */
export function SafeToSpend({
  monthLabel,
  daysLeft,
  elapsed,
  budget,
  spentThisMonth,
  netThisMonth,
  liquid,
  runwayDays,
  isLoading,
  onSetBudget,
}: SafeToSpendProps) {
  const { format, userCurrencyCode } = useCurrency();
  const money = (amount: number) => format(amount, userCurrencyCode);

  // lg:h-full lets the card fill its grid row, so it ends level with the
  // calendar beside it; the footer strip's lg:mt-auto takes up the slack.
  const shell =
    "flex flex-col lg:h-full lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:p-7";

  if (isLoading) {
    return (
      <div className={`${shell} animate-pulse`}>
        <div className="h-3 w-52 rounded bg-muted" />
        <div className="mt-4 h-16 w-64 rounded bg-muted lg:h-20" />
        <div className="mt-4 h-4 w-48 rounded bg-muted" />
        <div className="mt-6 h-2.5 w-full rounded-full bg-muted" />
        <div className="mt-6 h-16 rounded-2xl bg-muted lg:mt-auto" />
      </div>
    );
  }

  const overspent = budget !== null && budget.remaining < 0;
  const headline = budget ? Math.abs(budget.remaining) : spentThisMonth;
  const { lead, fraction, trail } = splitAmountParts(money(headline));

  const perDay = daysLeft > 0 && budget && !overspent ? budget.remaining / daysLeft : null;

  return (
    <div className={shell}>
      <Eyebrow className={overspent ? "text-destructive" : "text-primary"}>
        {budget
          ? overspent
            ? `Over budget · ${monthLabel}`
            : `Safe to spend · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left in ${monthLabel}`
          : `Spent in ${monthLabel} · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}
      </Eyebrow>

      <div
        data-testid="hero-amount"
        className={`mt-2 text-[3.25rem] leading-none font-bold tracking-tight tabular-nums lg:mt-2.5 lg:text-[5.5rem] ${
          overspent ? "text-destructive" : "text-foreground"
        }`}
      >
        {overspent && "−"}
        {lead}
        <span className="text-muted-foreground/60">
          {fraction}
          {trail}
        </span>
      </div>

      {budget ? (
        <>
          <p className="mt-2.5 text-sm text-muted-foreground lg:mt-3 lg:text-[15px]">
            {overspent ? (
              <>
                You are past the {monthLabel} budget of{" "}
                <strong className="font-semibold text-foreground">{money(budget.limit)}</strong>.
              </>
            ) : perDay !== null ? (
              <>
                That&apos;s{" "}
                <strong className="font-semibold text-foreground">{money(perDay)} a day</strong>{" "}
                until the month ends.
              </>
            ) : (
              <>Carried into next month.</>
            )}
          </p>

          <div className="mt-4 lg:mt-5">
            <div className="relative h-2.5 rounded-full bg-muted">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  overspent ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, budget.percentUsed))}%` }}
              />
              {/* Where the month itself has got to — spending should trail this. */}
              <div
                className="absolute -top-1 -bottom-1 w-0.5 rounded-sm bg-foreground/70"
                style={{ left: `${Math.min(100, elapsed * 100)}%` }}
                aria-hidden
              />
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground lg:text-xs">
              <span>
                <strong className="font-semibold text-foreground">{money(budget.spent)}</strong> of{" "}
                {money(budget.limit)}
              </span>
              <span className="font-mono">
                {Math.round(budget.percentUsed)}% used · pace {Math.round(elapsed * 100)}%
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Set a monthly budget to turn this into what&apos;s safe to spend.
          </p>
          <Button size="sm" variant="outline" onClick={onSetBudget}>
            Set a budget
          </Button>
        </div>
      )}

      {/* The supporting trio: a standalone strip on mobile, the card's footer on desktop. */}
      <dl className="mt-4 flex rounded-2xl border border-border bg-card px-1 py-3.5 lg:mt-auto lg:rounded-none lg:border-0 lg:border-t lg:bg-transparent lg:px-0 lg:pt-5 lg:pb-0">
        <Stat
          label="Net this month"
          value={
            <span className={netThisMonth >= 0 ? "text-secondary" : "text-foreground"}>
              {netThisMonth >= 0 && "+"}
              {money(netThisMonth)}
            </span>
          }
        />
        <Stat
          label="Cash runway"
          value={runwayDays === null ? "—" : `${runwayDays} days`}
          hint="at your recent pace"
        />
        <Stat
          label={`Liquid · ${liquid.liquidCount} of ${liquid.accountCount}`}
          value={money(liquid.total)}
          last
        />
      </dl>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  last = false,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  last?: boolean;
}) {
  return (
    <div
      className={`min-w-0 flex-1 px-2 text-center lg:px-0 lg:text-left ${
        last ? "" : "border-r border-border lg:border-r-0"
      } lg:not-first:border-l lg:not-first:border-border lg:not-first:pl-6 lg:not-last:pr-6`}
    >
      <dt className="truncate font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 truncate text-base font-semibold tabular-nums text-foreground lg:text-[17px]">
        {value}
        {hint && (
          <span className="ml-1.5 hidden text-xs font-normal text-muted-foreground lg:inline">
            {hint}
          </span>
        )}
      </dd>
    </div>
  );
}
