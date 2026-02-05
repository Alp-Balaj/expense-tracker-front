import { createContext, useContext, useState, useEffect } from "react";

type CurrencyId = string;

type CurrencyProviderProps = {
  children: React.ReactNode;
  storageKey?: string;
};

type CurrencyContextState = {
  currencyId: CurrencyId;
};

const defaultState: CurrencyContextState = {
  currencyId: "",
};

const CurrencyContext = createContext<CurrencyContextState>(defaultState);

export function CurrencyProvider({
  children,
  storageKey = "userCurrency",
}: CurrencyProviderProps) {
  const [currencyId, setCurrencyId] = useState<CurrencyId>(
    () => localStorage.getItem(storageKey) || ""
  );

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem(storageKey) || "";
      setCurrencyId(stored);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  return (
    <CurrencyContext.Provider value={{ currencyId }}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Hook to access the current preferred currency
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context)
    throw new Error("useCurrency must be used within a CurrencyProvider");
  return context;
};