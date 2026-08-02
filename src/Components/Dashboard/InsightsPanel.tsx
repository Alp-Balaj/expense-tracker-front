import { useMemo } from "react";
import { Info, Minus, Sparkles, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Panel, PanelHeader } from "@/Components/Dashboard/Panel";
import type { Insights } from "@/Models/Insights";
import { useCurrency } from "@/Hooks/useCurrency";
import { buildInsightSentences, type InsightTone } from "@/lib/insights";

interface InsightsPanelProps {
  insights: Insights | undefined;
  isLoading: boolean;
}

/**
 * What moved this month, as sentences rather than another chart: the server
 * compares the month against the trailing three and this panel reads the
 * biggest signals out loud.
 */

const TONE_ICONS: Record<InsightTone, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
  info: Info,
};

// Spending up is worth attention, not alarm — the accent colour, not the
// destructive one, matches how the rest of the dashboard flags pace.
const TONE_CLASSES: Record<InsightTone, string> = {
  up: "text-primary",
  down: "text-muted-foreground",
  flat: "text-muted-foreground",
  info: "text-muted-foreground",
};

export function InsightsPanel({ insights, isLoading }: InsightsPanelProps) {
  const { format, userCurrencyCode } = useCurrency();

  const sentences = useMemo(
    () =>
      insights
        ? buildInsightSentences(insights, (amount) => format(amount, userCurrencyCode))
        : [],
    // format closes over the currency table; insights changing is the signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [insights, userCurrencyCode],
  );

  if (isLoading) {
    return (
      <Panel className="animate-pulse p-5">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {["a", "b", "c"].map((id) => (
            <div key={id} className="h-3 w-full rounded bg-muted" />
          ))}
        </div>
      </Panel>
    );
  }

  if (!insights || sentences.length === 0) {
    return (
      <Panel className="p-5">
        <PanelHeader title="Insights" description="This month against your last three" />
        <p className="py-8 text-center text-sm text-muted-foreground">
          Insights appear once some spending is logged.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="p-5" data-testid="insights-panel">
      <PanelHeader
        title="Insights"
        description="This month against your last three"
        meta={
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {insights.month}
          </span>
        }
      />

      <ul className="mt-3.5 space-y-2.5">
        {sentences.map((sentence) => {
          const Icon = TONE_ICONS[sentence.tone];
          return (
            <li
              key={sentence.key}
              data-testid="insight-sentence"
              className="flex items-start gap-2.5 text-[13px] text-foreground"
            >
              <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${TONE_CLASSES[sentence.tone]}`} />
              <span className="min-w-0">{sentence.text}</span>
            </li>
          );
        })}
      </ul>

      {insights.hasMissingRates && (
        <p className="mt-3 text-xs text-muted-foreground">
          Some amounts could not be converted and are left out.
        </p>
      )}
    </Panel>
  );
}
