import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingSpinner from '../Components/LoadingSpinner';

export default function RequireAuth() {
  const { accessToken, isAuthReady } = useAuth();

  if (!isAuthReady) return <LoadingSpinner />;

  if (!accessToken) return <Navigate to="/login" replace />;

  return <Outlet />;
}
