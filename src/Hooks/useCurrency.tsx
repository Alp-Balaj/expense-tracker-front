import { useMemo } from "react";
import { usePreferences } from "@/Authorization/UserPreferencesContext";
import { useCurrenciesQuery } from "@/Hooks/queries/useCurrencies";
import type { Currency } from "@/Models/Currency";

// Every one of this hook's consumers shares the same ["currencies"] query
// cache entry, so mounting it in 13 places (or once per rendered row, as
// ConvertedAmount does) still fires a single network request.
export function useCurrency() {
  const { preferences } = usePreferences();
  const { data: currenciesFromDb = [] } = useCurrenciesQuery();

  const currenciesMap = useMemo(() => {
    const map: Record<string, Currency> = {};
    currenciesFromDb.forEach((c) => (map[c.code] = c));
    return map;
  }, [currenciesFromDb]);

  const userCurrencyCode = preferences?.baseCurrency ?? "EUR";

  const convert = (amount: number, fromCode: string) => {
    const from = currenciesMap[fromCode];
    const to = currenciesMap[userCurrencyCode];
    if (!from || !to) return amount;
    return (amount / from.exchangeRateToBase) * to.exchangeRateToBase;
  };

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

  return {
    userCurrencyCode,
    currenciesMap,
    convert,
    format,
    formatOriginal,
  };
}
