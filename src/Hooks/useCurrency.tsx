import { useMemo } from "react";
import { usePreferences } from "@/Authorization/UserPreferencesContext";
import { useCurrenciesQuery } from "@/Hooks/queries/useCurrencies";
import {
  buildRateMap,
  convertToBase,
  normalizeCode,
  rateFreshness,
  type RateFreshness,
} from "@/lib/exchangeRates";

// Every one of this hook's consumers shares the same ["currencies"] query
// cache entry, so mounting it in 13 places (or once per rendered row, as
// ConvertedAmount does) still fires a single network request.
//
// The conversion maths lives in @/lib/exchangeRates so it can be tested without
// mounting React — it is the one place the app's rate direction is decided, and
// it used to be decided the wrong way round (see that file's header).
export function useCurrency() {
  const { preferences } = usePreferences();
  const { data: currenciesFromDb = [] } = useCurrenciesQuery();

  const currenciesMap = useMemo(
    () => buildRateMap(currenciesFromDb),
    [currenciesFromDb],
  );

  const userCurrencyCode = normalizeCode(preferences?.baseCurrency) || "EUR";

  const convert = (amount: number, fromCode: string) =>
    convertToBase(amount, fromCode, userCurrencyCode, currenciesMap);

  const format = (amount: number, fromCode: string) => {
    const converted = convert(amount, fromCode);
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: userCurrencyCode,
      minimumFractionDigits: 2,
    }).format(converted);
  };

  const formatOriginal = (amount: number, fromCode: string) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: fromCode,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // How old the stored rates are, so the UI can admit it rather than presenting a
  // three-week-old number as though it were today's.
  const freshness: RateFreshness = useMemo(
    () => rateFreshness(currenciesFromDb, userCurrencyCode),
    [currenciesFromDb, userCurrencyCode],
  );

  return {
    userCurrencyCode,
    currenciesMap,
    convert,
    format,
    formatOriginal,
    rateFreshness: freshness,
  };
}
