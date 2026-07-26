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
import { useTheme } from "@/Components/Layout/ThemeProvider";

// Mirrors the backend UpdateUserPreferencesDTO: theme + baseCurrency are the
// only persisted preferences.
export type UserPreferences = {
  userId?: string;
  theme?: "light" | "dark" | "system";
  baseCurrency?: string;
};

type PreferencesContextValue = {
  preferences: UserPreferences | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  setPreferences: (prefs: UserPreferences | null) => void;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined,
);

const isTheme = (t: unknown): t is "light" | "dark" | "system" =>
  t === "light" || t === "dark" || t === "system";

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData, putDataNoId } = useAuthorizationApi();
  const { setTheme } = useTheme();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthReady || !accessToken) return;

    setIsLoading(true);
    try {
      const prefs = await getAllData<UserPreferences>("api/UserPreferences");
      setPreferences(prefs);
      if (isTheme(prefs?.theme)) setTheme(prefs.theme);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, getAllData, isAuthReady, setTheme]);

  const updatePreferences = useCallback(
    async (patch: Partial<UserPreferences>) => {
      const merged: UserPreferences = {
        theme: "system",
        baseCurrency: "EUR",
        ...preferences,
        ...patch,
      };
      // Apply the theme immediately so the UI doesn't wait on the network.
      if (isTheme(merged.theme)) setTheme(merged.theme);
      await putDataNoId("/api/UserPreferences", {
        theme: merged.theme,
        baseCurrency: merged.baseCurrency,
      });
      setPreferences(merged);
    },
    [preferences, putDataNoId, setTheme],
  );

  useEffect(() => {
    if (!isAuthReady) return;

    if (!accessToken) {
      setPreferences(null);
      return;
    }

    void refresh();
  }, [accessToken, isAuthReady, refresh]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      isLoading,
      refresh,
      setPreferences,
      updatePreferences,
    }),
    [preferences, isLoading, refresh, updatePreferences],
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
