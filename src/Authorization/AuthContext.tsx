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

type JwtPayload = {
  email?: string;
  unique_name?: string;
};

function decodeJwtPayload(token: string): JwtPayload {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as JwtPayload;
  } catch {
    return {};
  }
}

type AuthContextValue = {
  accessToken: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  isAuthReady: boolean;
  email: string;
  username: string;
};

const AuthorizationContext = createContext<AuthContextValue | undefined>(
  undefined,
);

type AuthorizationProviderProps = {
  children: ReactNode;
};

export function AuthorizationProvider({
  children,
}: AuthorizationProviderProps) {
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

  const { email, username } = useMemo(() => {
    if (!accessToken) return { email: "", username: "" };
    const payload = decodeJwtPayload(accessToken);
    return { email: payload.email ?? "", username: payload.unique_name ?? "" };
  }, [accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({ accessToken, setToken, logout, isAuthReady, email, username }),
    [accessToken, isAuthReady, logout, setToken, email, username],
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
