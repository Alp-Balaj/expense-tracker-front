import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/LoginPage";
import AccountPage from "./Pages/AccountPage";

import { AuthorizationProvider } from "./Authorization/AuthContext";
import RequireAuth from "./Authorization/RequireAuthentication";
import AxiosAuthBridge from "./Authorization/AxiosAuthBridge";

import AppLayout from "./Components/Layout/AppLayout";
import { SidebarProvider } from "./Components/ui/sidebar";
import CategoryAndCurrencyPage from "./Pages/CategoryAndCurrencyPage";

function App() {
  return (
    <BrowserRouter>
      <AuthorizationProvider>
        <SidebarProvider>
          <AxiosAuthBridge />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/categoryAndCurrency" element={<CategoryAndCurrencyPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/notFound" replace />} />
          </Routes>
        </SidebarProvider>
      </AuthorizationProvider>
    </BrowserRouter>
  );
}

export default App;
