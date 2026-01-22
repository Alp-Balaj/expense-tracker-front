import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LoadingSpinner from "../Components/LoadingSpinner.tsx";

export default function RequireAuth() {
  const { accessToken, isAuthReady } = useAuth();
  const location = useLocation();

  if (!isAuthReady) return <LoadingSpinner />;

  if (!accessToken)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}