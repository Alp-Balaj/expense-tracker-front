import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LoadingSpinner from "../Components/General/LoadingSpinner.tsx";

export default function RequireAuth() {
  const { accessToken, isAuthReady } = useAuth();
  const location = useLocation();

  if (!isAuthReady) return <LoadingSpinner />;

  if (!accessToken)
    // The query string is part of where they were going: /oauth/authorize carries
    // the whole OAuth request in it, and losing it would strand the sign-in.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  return <Outlet />;
}