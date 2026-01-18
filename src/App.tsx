import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/LoginPage";

import { AuthorizationProvider } from "./Authorization/AuthContext";
import RequireAuth from "./Authorization/RequireAuthentication";
import AxiosAuthBridge from "./Authorization/AxiosAuthBridge";

function App() {
  return (
    <BrowserRouter>
      <AuthorizationProvider>
        <AxiosAuthBridge />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route element={<RequireAuth />}>
              <Route path="/" element={<HomePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/notFound" replace />} />
          </Routes>
      </AuthorizationProvider>
    </BrowserRouter>
  );
}

export default App;
