import { useState, useEffect, useMemo } from "react";
import { usePreferences } from "@/Authorization/UserPreferencesContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import type { Currency } from "@/Models/Currency";

export function useCurrency() {
  const { preferences } = usePreferences();
  const { getAllData } = useAuthorizationApi();

  const [currenciesFromDb, setCurrenciesFromDb] = useState<Currency[]>([]);

  useEffect(() => {
    const fetchCurrencies = async () => {
      const data = await getAllData<Currency[]>("api/Currency");
      if (data) setCurrenciesFromDb(data);
    };
    void fetchCurrencies();
  }, [getAllData]);

  const currenciesMap = useMemo(() => {
    const map: Record<string, Currency> = {};
    currenciesFromDb.forEach((c) => (map[c.code] = c));
    return map;
  }, [currenciesFromDb]);

  const userCurrencyCode = preferences?.userPreferredCurrencyCode ?? "EUR";

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

  return {
    userCurrencyCode,
    currenciesMap,
    convert,
    format,
  };
}
