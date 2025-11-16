
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Authorization/AuthContext';
import { useState, useEffect } from 'react';
import LoadingSpinner from '../general/Loading';

function RequireAuth({ children }) {
    const { accessToken } = useAuth();
    const [shouldCheckAuth, setShouldCheckAuth] = useState(false);

    useEffect(() => {
    const timer = setTimeout(() => {
        setShouldCheckAuth(true);
    }, 500);

    return () => clearTimeout(timer);
    }, []);

    if (!shouldCheckAuth) {
    return <LoadingSpinner/>;
    }

    if (!accessToken) {
    return <Navigate to="/login" replace />;
    }

    return children;
}

export default RequireAuth;
    