import { useMemo } from "react";
import { Panel, PanelHeader } from "@/Components/Dashboard/Panel";
import { useCurrency } from "@/Hooks/useCurrency";
import type { Expense } from "@/Models/Expense";
import { buildSpendCalendar } from "@/lib/dashboard";
import { formatMonth } from "@/lib/budget";

interface SpendCalendarProps {
  expenses: Expense[];
  /** The month to chart, as "yyyy-MM". */
  month: string;
  isLoading: boolean;
}

const DAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

/** Level 0–4 as a tint of the brand colour, so it reads in either theme. */
const LEVEL_FILL = [
  "bg-muted",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary/70",
  "bg-primary",
] as const;

const LEVEL_TEXT = [
  "text-muted-foreground/70",
  "text-muted-foreground",
  "text-foreground/80",
  "text-primary-foreground/90",
  "text-primary-foreground",
] as const;

/**
 * A day-by-day heatmap of the month's spending — the shape of a month at a
 * glance, and which days were never logged.
 */
export function SpendCalendar({ expenses, month, isLoading }: SpendCalendarProps) {
  const { format, userCurrencyCode } = useCurrency();
  const calendar = useMemo(() => buildSpendCalendar(expenses, month), [expenses, month]);

  const monthName = formatMonth(month).split(" ")[0];

  if (isLoading) {
    return (
      <Panel className="flex animate-pulse flex-col p-5">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted" />
          ))}
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="flex flex-col p-5">
      <PanelHeader
        title="Spend calendar"
        meta={
          calendar.spentDays + calendar.quietDays > 0
            ? `${calendar.spentDays} spent · ${calendar.quietDays} quiet`
            : monthName
        }
      />

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {DAY_INITIALS.map((initial, i) => (
          <span
            key={`${initial}-${i}`}
            className="text-center font-mono text-[10.5px] font-bold text-muted-foreground/70"
          >
            {initial}
          </span>
        ))}

        {calendar.cells.map((cell) =>
          cell.kind === "blank" ? (
            <span key={cell.key} />
          ) : (
            <div
              key={cell.key}
              title={
                cell.isFuture
                  ? `${cell.day} ${monthName} — still to come`
                  : `${cell.day} ${monthName} — ${
                      cell.amount > 0 ? format(cell.amount, userCurrencyCode) : "nothing logged"
                    }`
              }
              className={`flex aspect-square items-start justify-end rounded-[9px] p-1 ${
                cell.isFuture
                  ? "border border-dashed border-border"
                  : `${LEVEL_FILL[cell.level]} ${cell.isToday ? "ring-2 ring-foreground ring-inset" : ""}`
              }`}
            >
              <span
                className={`font-mono text-[10.5px] font-bold ${
                  cell.isFuture ? "text-muted-foreground/50" : LEVEL_TEXT[cell.level]
                }`}
              >
                {cell.day}
              </span>
            </div>
          ),
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 lg:mt-auto lg:pt-4">
        <span className="font-mono text-[9.5px] text-muted-foreground">
          {format(0, userCurrencyCode)}
        </span>
        <div className="flex gap-[3px]">
          {LEVEL_FILL.map((fill, level) => (
            <span key={level} className={`h-2.5 w-4 rounded-[3px] ${fill}`} />
          ))}
        </div>
        <span className="font-mono text-[9.5px] text-muted-foreground">
          {calendar.scaleTop > 0 ? `${format(calendar.scaleTop, userCurrencyCode)}+` : "—"}
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[9.5px] uppercase text-muted-foreground">
          {calendar.busiestDay === null
            ? monthName
            : `Busiest ${calendar.busiestDay} ${monthName}`}
        </span>
      </div>
    </Panel>
  );
}
