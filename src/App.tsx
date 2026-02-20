import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

import { AuthorizationProvider } from "./Authorization/AuthContext";
import RequireAuth from "./Authorization/RequireAuthentication";
import AxiosAuthBridge from "./Authorization/AxiosAuthBridge";

import AppLayout from "./Components/Layout/AppLayout";
import { ThemeProvider } from "./Components/Layout/ThemeProvider";
import { UserPreferencesProvider } from "./Authorization/UserPreferencesContext";
import { SidebarProvider } from "./Components/ui/sidebar";

import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/LoginPage";
const AccountPage = lazy(() => import("./Pages/AccountPage"));
const CategoryAndCurrencyPage = lazy(
  () => import("./Pages/CategoryAndCurrencyPage"),
);
const ReportsPage = lazy(() => import("./Pages/ReportPage"));
const IncomePage = lazy(() => import("./Pages/IncomePage"));
const SavingPage = lazy(() => import("./Pages/SavingPage"));

function App() {
  return (
    <BrowserRouter>
      <AuthorizationProvider>
        <UserPreferencesProvider>
          <ThemeProvider>
            <SidebarProvider>
              <AxiosAuthBridge />
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  {/* Public */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected */}
                  <Route element={<RequireAuth />}>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/account" element={<AccountPage />} />
                      <Route path="/income" element={<IncomePage />} />
                      <Route
                        path="/categoryAndCurrency"
                        element={<CategoryAndCurrencyPage />}
                      />
                      <Route path="/savings" element={<SavingPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                    </Route>
                  </Route>

                  {/* Fallback */}
                  <Route
                    path="*"
                    element={<Navigate to="/notFound" replace />}
                  />
                </Routes>
              </Suspense>
            </SidebarProvider>
          </ThemeProvider>
        </UserPreferencesProvider>
      </AuthorizationProvider>
    </BrowserRouter>
  );
}

export default App;
