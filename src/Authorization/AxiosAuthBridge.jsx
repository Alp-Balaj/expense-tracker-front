import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../Services/api.ts";
import { useAuth } from "./AuthContext";

let redirecting = false;

export default function AxiosAuthBridge() {
  const { accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tokenRef = useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    console.log("AxiosAuthBridge mounted");
    const reqId = api.interceptors.request.use((config) => {
      const token = tokenRef.current;
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const resId = api.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err?.response?.status;

        if (status === 401) {
          if (!redirecting) {
            redirecting = true;

            logout();

            if (location.pathname !== "/login") {
              navigate("/login", {
                replace: true,
                state: { from: location.pathname },
              });
            }

            setTimeout(() => (redirecting = false), 0);
          }
        }

        return Promise.reject(err);
      }
    );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, [logout, navigate, location.pathname]);

  return null;
}