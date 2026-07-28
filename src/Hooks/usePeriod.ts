import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_PERIOD_PRESET,
  resolvePeriod,
  type Period,
  type PeriodPreset,
} from "@/lib/period";

const STORAGE_PREFIX = "et.period.";

type StoredPeriod = {
  preset: PeriodPreset;
  from: string;
  to: string;
};

function read(scope: string): StoredPeriod | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + scope);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPeriod>;
    if (typeof parsed?.preset !== "string") return null;
    return {
      preset: parsed.preset as PeriodPreset,
      from: String(parsed.from ?? ""),
      to: String(parsed.to ?? ""),
    };
  } catch {
    // Private-mode / disabled storage, or a value from an older shape.
    return null;
  }
}

function write(scope: string, period: Period): void {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + scope,
      JSON.stringify({ preset: period.preset, from: period.from, to: period.to }),
    );
  } catch {
    // Persistence is a convenience; never let it break the page.
  }
}

/**
 * The selected period for one page, remembered across reloads so the app opens
 * where you live.
 *
 * Only the *preset* is really restored: a stored "This month" re-resolves
 * against today, so a tab left open over a month boundary — or reopened in
 * August — shows August rather than the July bounds that were saved. Custom
 * ranges are the exception; their explicit dates are what was chosen.
 */
export function usePeriod(scope: string, fallback: PeriodPreset = DEFAULT_PERIOD_PRESET) {
  const [period, setPeriod] = useState<Period>(() => {
    const stored = read(scope);
    if (!stored) return resolvePeriod(fallback);
    if (stored.preset === "custom" && stored.from && stored.to) {
      return resolvePeriod("custom", undefined, { from: stored.from, to: stored.to });
    }
    return resolvePeriod(stored.preset);
  });

  const setPreset = useCallback(
    (preset: PeriodPreset) => {
      // Switching to "custom" from the dropdown keeps the bounds currently on
      // screen as the starting range, so the calendars open somewhere useful.
      const next =
        preset === "custom"
          ? resolvePeriod("custom", undefined, { from: period.from, to: period.to })
          : resolvePeriod(preset);
      setPeriod(next);
      write(scope, next);
    },
    [period.from, period.to, scope],
  );

  const setCustomRange = useCallback(
    (range: { from: string; to: string }) => {
      const next = resolvePeriod("custom", undefined, range);
      setPeriod(next);
      write(scope, next);
    },
    [scope],
  );

  return useMemo(
    () => ({ period, setPreset, setCustomRange }),
    [period, setPreset, setCustomRange],
  );
}
