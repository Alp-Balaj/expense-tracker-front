import { useMemo } from "react";
import { parseISO } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Panel, PanelHeader } from "@/Components/Dashboard/Panel";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/Components/ui/chart";
import type { CashflowProjection } from "@/Models/Cashflow";
import { useCurrency } from "@/Hooks/useCurrency";
import { splitAmountParts } from "@/lib/dashboard";
import { firstBelowZero, lowestPoint } from "@/lib/cashflow";

interface CashflowPanelProps {
  projection: CashflowProjection | undefined;
  isLoading: boolean;
}

function compactNumber(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}k`;
  return String(Math.round(value));
}

function shortDate(date: string): string {
  return parseISO(date).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * Where the liquid balance is heading: today's spendable money walked forward
 * a month, losing the everyday burn each day and paying every planned bill on
 * its due date. The chart is desktop-only (the house rule for charts on
 * phones), so the headline figure and the pinch warning carry the story alone
 * on small screens.
 */
export function CashflowPanel({ projection, isLoading }: CashflowPanelProps) {
  const { format, userCurrencyCode } = useCurrency();

  const chartData = useMemo(
    () =>
      (projection?.points ?? []).map((point) => ({
        date: point.date,
        label: shortDate(point.date),
        balance: point.projectedBalance,
      })),
    [projection],
  );

  if (isLoading) {
    return (
      <Panel className="animate-pulse p-5">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="mt-4 h-7 w-32 rounded bg-muted" />
        <div className="mt-4 h-40 w-full rounded bg-muted" />
      </Panel>
    );
  }

  if (!projection || projection.points.length === 0) {
    return (
      <Panel className="p-5">
        <PanelHeader title="Cash flow" description="Projected liquid balance" />
        <p className="py-8 text-center text-sm text-muted-foreground">
          Add an account to see where the month is heading.
        </p>
      </Panel>
    );
  }

  const money = (amount: number) => format(amount, userCurrencyCode);
  const { lead, fraction, trail } = splitAmountParts(money(projection.projectedEndOfMonthBalance));
  const low = lowestPoint(projection.points);
  const crossing = firstBelowZero(projection.points);

  const chartConfig = {
    balance: { label: "Projected", color: "#c96442" },
  };

  return (
    <Panel className="p-5" data-testid="cashflow-panel">
      <PanelHeader
        title="Cash flow"
        description="Liquid balance projected 30 days out"
        meta={`Burn ${money(projection.dailyBurnRate)}/day`}
      />

      <div
        data-testid="cashflow-projected"
        className="mt-3.5 text-2xl font-bold tracking-tight tabular-nums text-foreground"
      >
        {lead}
        <span className="text-muted-foreground/60">
          {fraction}
          {trail}
        </span>
        <span className="text-[13px] font-normal text-muted-foreground">
          {" "}
          by {shortDate(projection.endOfMonth)}
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground" data-testid="cashflow-note">
        {crossing !== null
          ? `Dips below zero around ${shortDate(crossing.date)} — a planned bill may need cover.`
          : `Lowest point ${low === null ? "" : money(low.projectedBalance)}${
              low === null ? "" : ` around ${shortDate(low.date)}`
            }, ending the window at ${money(projection.projectedEndBalance)}.`}
      </p>

      {/*
        Desktop-only, like every other chart in the app: on phones it would eat
        the screen, and the headline plus the note above carry the same story.
      */}
      <div className="mt-4 hidden md:block">
        <ChartContainer config={chartConfig} className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={6}
                className="text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => compactNumber(value)}
                className="text-muted-foreground"
                width={48}
                domain={["auto", "auto"]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-medium">{money(Number(value))}</span>
                    )}
                  />
                }
              />
              {crossing !== null && (
                <ReferenceLine y={0} strokeDasharray="4 4" className="stroke-destructive" />
              )}
              <Line
                type="monotone"
                dataKey="balance"
                stroke="var(--color-balance)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                // A projection is a statement, not a reveal — and animation
                // frames read as a half-drawn line in screenshots.
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </Panel>
  );
}
