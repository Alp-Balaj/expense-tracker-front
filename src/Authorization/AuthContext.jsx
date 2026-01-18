import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "accessToken";

const AuthorizationContext = createContext(undefined);

export function AuthorizationProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    setAccessToken(token);
    setIsAuthReady(true);
  }, []);

  const setToken = useCallback((token) => {
    setAccessToken(token);
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  const value = useMemo(
    () => ({ accessToken, setToken, logout, isAuthReady }),
    [accessToken, isAuthReady, logout, setToken]
  );

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthorizationContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within AuthorizationProvider");
  }
  return ctx;
}
