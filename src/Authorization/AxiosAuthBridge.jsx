import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../Services/api.ts";
import { useAuth } from "./AuthContext";

export default function AxiosAuthBridge() {
  const { accessToken, logout, setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tokenRef = useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const isRefreshingRef = useRef(false);
  const refreshQueueRef = useRef([]);

  const redirectingRef = useRef(false);

  useEffect(() => {
    const reqId = api.interceptors.request.use((config) => {
      const token = tokenRef.current;
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const processQueueSuccess = (newToken) => {
      const queue = refreshQueueRef.current;
      refreshQueueRef.current = [];

      queue.forEach(({ original, resolve, reject }) => {
        try {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(original));
        } catch (e) {
          reject(e);
        }
      });
    };

    const processQueueFail = (error) => {
      const queue = refreshQueueRef.current;
      refreshQueueRef.current = [];
      queue.forEach(({ reject }) => reject(error));
    };

    const resId = api.interceptors.response.use(
      (res) => res,
      (err) =>
        handle401({
          err, api, logout,
          navigate, location, setToken,
          tokenRef, isRefreshingRef, refreshQueueRef,
          redirectingRef, processQueueSuccess, processQueueFail,
        })
      );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, [logout, navigate, location, setToken]);

  return null;
}

// Handle 401 responses with token refresh
async function handle401({
  err, api, logout,
  navigate, location, setToken,
  tokenRef, isRefreshingRef, refreshQueueRef,
  redirectingRef, processQueueSuccess, processQueueFail,
}) {
  const status = err?.response?.status;
  const original = err?.config;

  if (status !== 401 || !original) {
    throw err;
  }

  const isRefreshCall = original.url?.includes("/api/User/refresh");
  if (isRefreshCall || original._retry) {
    if (!redirectingRef.current) {
      redirectingRef.current = true;
      logout();

      if (location.pathname !== "/login") {
        navigate("/login", {
          replace: true,
          state: { from: location.pathname },
        });
      }

      setTimeout(() => (redirectingRef.current = false), 0);
    }

    throw err;
  }

  original._retry = true;

  // Queue if refresh already running
  if (isRefreshingRef.current) {
    return new Promise((resolve, reject) => {
      refreshQueueRef.current.push({ original, resolve, reject });
    });
  }

  isRefreshingRef.current = true;

  try {
    const refreshRes = await api.post("/api/User/refresh");
    console.log("A, response:", refreshRes);
    console.log("B, data:", refreshRes.data);
    console.log("C, data:", refreshRes.data?.token);
    const newToken = refreshRes.data?.token;

    if (!newToken) throw new Error("Refresh returned no access token");

    setToken(newToken);
    tokenRef.current = newToken;

    processQueueSuccess(newToken);

    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  }
  catch (refreshErr) {
    processQueueFail(refreshErr);

    if (!redirectingRef.current) {
      redirectingRef.current = true;
      logout();

      if (location.pathname !== "/login") {
        navigate("/login", {
          replace: true,
          state: { from: location.pathname },
        });
      }

      setTimeout(() => (redirectingRef.current = false), 0);
    }

    throw refreshErr;
  }
  finally {
    isRefreshingRef.current = false;
  }
}