import { createContext, useContext, useEffect, useMemo, useState } from "react";

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

  const setToken = (token) => {
    setAccessToken(token);
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ accessToken, setToken, isAuthReady }),
    [accessToken, isAuthReady]
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
