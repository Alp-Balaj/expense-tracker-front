import { useMemo } from "react";
import { parseISO } from "date-fns";
import {
  Car,
  Cloud,
  Dumbbell,
  House,
  Music,
  Repeat,
  Smartphone,
  Tv,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Panel, PanelHeader } from "@/Components/Dashboard/Panel";
import type { Expense } from "@/Models/Expense";
import { useCurrency } from "@/Hooks/useCurrency";
import { toISODate } from "@/lib/dates";
import { detectRecurring, recurringMonthlyTotal, splitAmountParts } from "@/lib/dashboard";

interface RecurringSpendProps {
  expenses: Expense[];
  isLoading: boolean;
}

const MAX_ROWS = 5;

/** Nothing tags an expense as a subscription, so the icon is guessed from the title. */
const ICON_HINTS: [RegExp, LucideIcon][] = [
  [/spotify|music|apple music|deezer|tidal/i, Music],
  [/netflix|disney|hbo|prime|stream|tv|cinema/i, Tv],
  [/gym|fitness|yoga|climb|pool/i, Dumbbell],
  [/mobile|phone|sim|telekom|vodafone|o2/i, Smartphone],
  [/cloud|storage|drive|dropbox|backup|hosting|domain/i, Cloud],
  [/car|insurance|leasing|parking/i, Car],
  [/rent|mortgage|hausgeld|miete/i, House],
  [/electric|energy|gas|power|strom|utilit/i, Zap],
];

function iconFor(name: string): LucideIcon {
  return ICON_HINTS.find(([pattern]) => pattern.test(name))?.[1] ?? Repeat;
}

function renewsOn(date: string) {
  return parseISO(toISODate(date)).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/**
 * Subscriptions inferred from expense history — anything charged three or
 * more times on a roughly monthly cadence for a steady amount.
 */
export function RecurringSpend({ expenses, isLoading }: RecurringSpendProps) {
  const { format, userCurrencyCode } = useCurrency();

  const charges = useMemo(() => detectRecurring(expenses), [expenses]);
  const monthly = recurringMonthlyTotal(charges);
  const shown = charges.slice(0, MAX_ROWS);

  const skeletonItems = ["a", "b", "c"];

  if (isLoading) {
    return (
      <Panel className="animate-pulse p-5">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="mt-4 h-7 w-32 rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {skeletonItems.map((id) => (
            <div key={id} className="h-3 w-full rounded bg-muted" />
          ))}
        </div>
      </Panel>
    );
  }

  if (shown.length === 0) {
    return (
      <Panel className="p-5">
        <PanelHeader title="Recurring" description="Subscriptions found in your history" />
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing repeating yet. A charge shows up here once it has appeared three months running.
        </p>
      </Panel>
    );
  }

  const { lead, fraction, trail } = splitAmountParts(format(monthly, userCurrencyCode));

  return (
    <Panel className="p-5" data-testid="recurring-panel">
      <PanelHeader
        title="Recurring"
        description={`${charges.length} ${
          charges.length === 1 ? "subscription" : "subscriptions"
        } found in your history`}
      />

      <div
        data-testid="recurring-total"
        className="mt-3.5 text-2xl font-bold tracking-tight tabular-nums text-foreground"
      >
        {lead}
        <span className="text-muted-foreground/60">
          {fraction}
          {trail}
        </span>
        <span className="text-[13px] font-normal text-muted-foreground"> / mo</span>
      </div>

      <ul className="mt-3.5 space-y-2.5">
        {shown.map((charge) => {
          const Icon = iconFor(charge.name);
          return (
            <li key={charge.key} className="flex items-center gap-2.5 text-[13px]">
              <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{charge.name}</span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground/80">
                {renewsOn(charge.nextDate)}
              </span>
              <span className="w-16 shrink-0 text-right font-semibold tabular-nums text-foreground">
                {format(charge.amount, userCurrencyCode)}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
