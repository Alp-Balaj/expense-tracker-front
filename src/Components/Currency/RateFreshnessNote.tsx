import { formatRateAge, type RateFreshness } from "@/lib/exchangeRates";
import { AlertTriangle, Clock } from "lucide-react";

interface RateFreshnessNoteProps {
  freshness: RateFreshness;
  className?: string;
}

/**
 * The "rates from 3 days ago" hint the suggestion asks for: subtle by default,
 * and only raising its voice once the rates are genuinely stale. Stale rates
 * aren't an error — a failed fetch deliberately keeps the old numbers — so this
 * states the age rather than warning about a failure.
 */
export function RateFreshnessNote({ freshness, className }: RateFreshnessNoteProps) {
  const label = formatRateAge(freshness);
  if (!label) return null;

  const needsAttention = freshness.isStale || freshness.hasUnknownAge;
  const Icon = needsAttention ? AlertTriangle : Clock;

  return (
    <p
      className={[
        "flex items-center gap-1.5 text-xs",
        needsAttention ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground",
        className ?? "",
      ].join(" ")}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </p>
  );
}
