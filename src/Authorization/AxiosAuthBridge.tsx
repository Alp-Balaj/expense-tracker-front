import { useEffect, useRef } from "react";
import { useLocation, useNavigate, type Location } from "react-router-dom";
import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { api } from "../Services/api";
import { useAuth } from "./AuthContext";

type Token = string | null;

type QueueItem = {
  original: RetryableRequestConfig;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

// Axios's request config type doesn't include custom fields like _retry.
// We extend it safely.
type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// Auth endpoints answer 401 for bad credentials, not expired sessions —
// their errors must propagate to the calling form instead of triggering
// a refresh. Compared against the request's resolved pathname, lowercased.
const REFRESH_PATH = "/api/user/refresh";
const AUTH_EXEMPT_PATHS = [
  "/api/user/login",
  "/api/user/signup",
  "/api/user/logout",
  // Anonymous by design: reached from an emailed link, possibly with no session.
  "/api/user/forgot-password",
  "/api/user/reset-password",
  "/api/user/confirm-email",
  REFRESH_PATH,
];

function requestPathname(config: InternalAxiosRequestConfig): string {
  try {
    const base = new URL(config.baseURL ?? "", window.location.origin);
    return new URL(config.url ?? "", base).pathname.toLowerCase();
  } catch {
    return "";
  }
}

type Handle401Args = {
  err: AxiosError;
  api: AxiosInstance;
  logout: () => void;
  navigateRef: React.RefObject<ReturnType<typeof useNavigate>>;
  locationRef: React.RefObject<Location>;
  setToken: (token: string | null) => void;

  tokenRef: React.RefObject<Token>;
  isRefreshingRef: React.RefObject<boolean>;
  refreshQueueRef: React.RefObject<QueueItem[]>;
  redirectingRef: React.RefObject<boolean>;

  processQueueSuccess: (newToken: string) => void;
  processQueueFail: (error: unknown) => void;
};

export default function AxiosAuthBridge(): null {
  const { accessToken, logout, setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tokenRef = useRef<Token>(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  // navigate and location change identity on every route change; the
  // interceptors read them through refs so they register only once.
  const navigateRef = useRef(navigate);
  const locationRef = useRef(location);
  useEffect(() => {
    navigateRef.current = navigate;
    locationRef.current = location;
  }, [navigate, location]);

  const isRefreshingRef = useRef<boolean>(false);
  const refreshQueueRef = useRef<QueueItem[]>([]);
  const redirectingRef = useRef<boolean>(false);

  useEffect(() => {
    const reqId = api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = tokenRef.current;
        if (token) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );

    const processQueueSuccess = (newToken: string) => {
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

    const processQueueFail = (error: unknown) => {
      const queue = refreshQueueRef.current;
      refreshQueueRef.current = [];
      queue.forEach(({ reject }) => reject(error));
    };

    const resId = api.interceptors.response.use(
      (res: AxiosResponse) => res,
      (err: AxiosError) =>
        handle401({
          err,
          api,
          logout,
          navigateRef,
          locationRef,
          setToken,
          tokenRef,
          isRefreshingRef,
          refreshQueueRef,
          redirectingRef,
          processQueueSuccess,
          processQueueFail,
        })
    );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, [logout, setToken]);

  return null;
}

// Handle 401 responses with token refresh
async function handle401({
  err, api, logout,
  navigateRef, locationRef, setToken,
  tokenRef, isRefreshingRef, refreshQueueRef,
  redirectingRef, processQueueSuccess, processQueueFail,
}: Handle401Args): Promise<unknown> {
  const status = err.response?.status;
  const original = err.config as RetryableRequestConfig | undefined;

  if (status !== 401 || !original) {
    throw err;
  }

  const pathname = requestPathname(original);
  const isRefreshCall = pathname === REFRESH_PATH;

  if (isRefreshCall || original._retry) {
    if (!redirectingRef.current) {
      redirectingRef.current = true;
      logout();

      const location = locationRef.current;
      if (location.pathname !== "/login") {
        navigateRef.current("/login", {
          replace: true,
          state: { from: location.pathname },
        });
      }

      setTimeout(() => (redirectingRef.current = false), 0);
    }

    throw err;
  }

  // A 401 from an auth endpoint (wrong password, expired signup token, …)
  // or from a request that never carried a bearer token is not an expired
  // session — skip the refresh flow and let the caller handle the error.
  const hadAuthHeader = Boolean(original.headers?.Authorization);
  if (AUTH_EXEMPT_PATHS.includes(pathname) || !hadAuthHeader) {
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
    const refreshRes = await api.post<{ token?: string }>("/api/User/refresh");
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

      const location = locationRef.current;
      if (location.pathname !== "/login") {
        navigateRef.current("/login", {
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