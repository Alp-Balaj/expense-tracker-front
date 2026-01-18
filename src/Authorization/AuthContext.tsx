import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "accessToken";

type AuthContextValue = {
  accessToken: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  isAuthReady: boolean;
};

const AuthorizationContext = createContext<AuthContextValue | undefined>(
  undefined
);

type AuthorizationProviderProps = {
  children: ReactNode;
};

export function AuthorizationProvider({ children }: AuthorizationProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    setAccessToken(token);
    setIsAuthReady(true);
  }, []);

  const setToken = useCallback((token: string | null) => {
    setAccessToken(token);
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  const value = useMemo<AuthContextValue>(
    () => ({ accessToken, setToken, logout, isAuthReady }),
    [accessToken, isAuthReady, logout, setToken]
  );

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthorizationContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within AuthorizationProvider");
  }
  return ctx;
}
