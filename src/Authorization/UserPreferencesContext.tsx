import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/Authorization/AuthContext";
import type { AxiosError } from "axios";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";

export type UserPreferences = {
  userId?: string;
  theme?: "light" | "dark" | "system";
  userBaseCurrencyCode?: string;
  userPreferredCurrencyCode?: string;
};

type PreferencesContextValue = {
  preferences: UserPreferences | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  setPreferences: (prefs: UserPreferences | null) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined,
);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData } = useAuthorizationApi();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const applyTheme = useCallback((theme?: UserPreferences["theme"]) => {
    // Example approach: use a class on <html>
    // Adjust to your theme system (shadcn typically uses "dark" class).
    const root = document.documentElement;

    root.classList.remove("dark");

    if (theme === "dark") root.classList.add("dark");
    if (theme === "light") root.classList.remove("dark");
    if (theme === "system") {
      const prefersDark = window.matchMedia?.(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) root.classList.add("dark");
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthReady || !accessToken) return;

    setIsLoading(true);
    try {
      const prefs = await getAllData<UserPreferences>("api/UserPreferences");
      setPreferences(prefs);
      applyTheme(prefs?.theme);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, applyTheme, getAllData, isAuthReady]);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!accessToken) {
      setPreferences(null);
      applyTheme("system");
      return;
    }

    void refresh();
  }, [accessToken, isAuthReady, refresh, applyTheme]);

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, isLoading, refresh, setPreferences }),
    [preferences, isLoading, refresh],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx)
    throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
