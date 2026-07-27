import type { Currency } from "@/Models/Currency";

/**
 * Rate direction — the one rule everything in this file exists to enforce.
 *
 * `exchangeRateToBase` is the multiplier INTO the user's base currency:
 *
 *     amountInBase = amount * exchangeRateToBase
 *
 * so a USD row under an EUR base holds ~0.878 (one dollar is worth 0.878 euro),
 * and the base currency's own row is exactly 1. This is the backend's convention
 * (Fix-10, and what the daily rate fetcher writes).
 *
 * The UI used to assume the exact opposite — "how many X equal 1 EUR" — and
 * divided by the rate, so every converted figure on the dashboard came out
 * inverted. Rates are only worth auto-updating if they are then read the right
 * way round, so Sugg-8 flips the UI onto the backend's convention.
 */

/** Below this, the hint stays quiet: a weekend gap is normal, the ECB has no weekend quotes. */
export const STALE_AFTER_DAYS = 3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const normalizeCode = (code?: string | null): string =>
  (code ?? "").trim().toUpperCase();

/** Codes are compared case-insensitively, matching the backend's OrdinalIgnoreCase lookups. */
export function buildRateMap(currencies: Currency[]): Record<string, Currency> {
  const map: Record<string, Currency> = {};
  for (const currency of currencies) {
    const code = normalizeCode(currency.code);
    if (code) map[code] = currency;
  }
  return map;
}

/**
 * Converts `amount` from `fromCode` into `baseCode`. Falls back to the unconverted
 * amount when there is no usable rate — showing the raw number is honest, whereas
 * a made-up rate would be confidently wrong.
 */
export function convertToBase(
  amount: number,
  fromCode: string | null | undefined,
  baseCode: string,
  rates: Record<string, Currency>,
): number {
  const from = normalizeCode(fromCode);
  const base = normalizeCode(baseCode);

  // An amount already in the base currency needs no rate at all. This also means a
  // user who never created a Currency row for their own base still gets correct
  // totals — the old implementation looked the base row up and gave up without it.
  if (!from || from === base) return amount;

  const rate = rates[from]?.exchangeRateToBase;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) return amount;

  return amount * rate;
}

export type RateFreshness = {
  /** Oldest stamp among the currencies that actually need a rate; null when none is known. */
  oldestUpdatedAt: Date | null;
  /** Whole days since `oldestUpdatedAt`, null when nothing is stamped. */
  ageInDays: number | null;
  /** At least one non-base currency has never had its rate age recorded. */
  hasUnknownAge: boolean;
  isStale: boolean;
};

/**
 * Summarises how old the stored rates are. The base currency is skipped: its rate is
 * 1 by definition and can never go stale, so including it would permanently peg the
 * age at "today" and hide genuinely stale rates behind it.
 */
export function rateFreshness(
  currencies: Currency[],
  baseCode: string,
  now: Date = new Date(),
): RateFreshness {
  const base = normalizeCode(baseCode);
  const needRates = currencies.filter((c) => normalizeCode(c.code) !== base);

  let oldest: Date | null = null;
  let hasUnknownAge = false;

  for (const currency of needRates) {
    const raw = currency.rateUpdatedAtUtc;
    if (!raw) {
      // Rows predating Sugg-8: the age is genuinely unknown, which is not the same
      // as old, and must not be reported as either.
      hasUnknownAge = true;
      continue;
    }
    const stamp = new Date(raw);
    if (Number.isNaN(stamp.getTime())) {
      hasUnknownAge = true;
      continue;
    }
    if (oldest === null || stamp < oldest) oldest = stamp;
  }

  const ageInDays =
    oldest === null
      ? null
      : Math.max(0, Math.floor((now.getTime() - oldest.getTime()) / MS_PER_DAY));

  return {
    oldestUpdatedAt: oldest,
    ageInDays,
    hasUnknownAge,
    isStale: ageInDays !== null && ageInDays >= STALE_AFTER_DAYS,
  };
}

/**
 * The subtle hint the suggestion asks for. Returns null when there is nothing worth
 * saying — no currencies to convert, or rates fetched today.
 */
export function formatRateAge(freshness: RateFreshness): string | null {
  const { ageInDays, hasUnknownAge } = freshness;

  if (ageInDays === null) {
    return hasUnknownAge ? "Exchange rates have never been updated" : null;
  }

  if (ageInDays === 0) return "Rates updated today";
  if (ageInDays === 1) return "Rates from yesterday";
  return `Rates from ${ageInDays} days ago`;
}
