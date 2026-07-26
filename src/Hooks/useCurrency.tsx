import { useState, useEffect, useMemo } from "react";
import type { AxiosError } from "axios";
import { usePreferences } from "@/Authorization/UserPreferencesContext";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import type { Currency } from "@/Models/Currency";

export function useCurrency() {
  const { preferences } = usePreferences();
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData } = useAuthorizationApi();

  const [currenciesFromDb, setCurrenciesFromDb] = useState<Currency[]>([]);

  useEffect(() => {
    if (!isAuthReady || !accessToken) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await getAllData<Currency[]>("api/Currency");
        if (!cancelled && data) setCurrenciesFromDb(data);
      } catch (e: unknown) {
        const err = e as AxiosError;
        if (err.response?.status !== 401) console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, accessToken, getAllData]);

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
