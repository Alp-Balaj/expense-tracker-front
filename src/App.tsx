import type { CSSProperties } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/LoginPage";
import ForgotPasswordPage from "./Pages/ForgotPasswordPage";
import ResetPasswordPage from "./Pages/ResetPasswordPage";
import ConfirmEmailPage from "./Pages/ConfirmEmailPage";
import AccountPage from "./Pages/AccountPage";
import NotFoundPage from "./Pages/NotFoundPage";

import { AuthorizationProvider } from "./Authorization/AuthContext";
import RequireAuth from "./Authorization/RequireAuthentication";
import AxiosAuthBridge from "./Authorization/AxiosAuthBridge";

import AppLayout from "./Components/Layout/AppLayout";
import { SidebarProvider } from "./Components/ui/sidebar";
import CategoryAndCurrencyPage from "./Pages/CategoryAndCurrencyPage";
import ReportsPage from "./Pages/ReportPage";
import { UserPreferencesProvider } from "./Authorization/UserPreferencesContext";
import { ThemeProvider } from "./Components/Layout/ThemeProvider";
import IncomePage from "./Pages/IncomePage";
import ExpensePage from "./Pages/ExpensePage";
import SavingPage from "./Pages/SavingPage";
import BudgetPage from "./Pages/BudgetPage";
import PlannedPage from "./Pages/PlannedPage";
import AddExpensePage from "./Pages/AddExpensePage";

function App() {
  return (
    <BrowserRouter>
      <AuthorizationProvider>
        <ThemeProvider defaultTheme="light">
          <UserPreferencesProvider>
            {/* 252px is the rail width the nav design is drawn at. */}
            <SidebarProvider style={{ "--sidebar-width": "252px" } as CSSProperties}>
              <AxiosAuthBridge />
              <Toaster richColors position="top-right" />
              <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                {/* The emailed links land on these two with email+token query params. */}
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/confirm-email" element={<ConfirmEmailPage />} />

                {/* Protected */}
                <Route element={<RequireAuth />}>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/add" element={<AddExpensePage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/expenses" element={<ExpensePage />} />
                    <Route path="/income" element={<IncomePage />} />
                    <Route path="/categoryAndCurrency" element={<CategoryAndCurrencyPage />} />
                    <Route path="/savings" element={<SavingPage />} />
                    <Route path="/budgets" element={<BudgetPage />} />
                    <Route path="/planned" element={<PlannedPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </SidebarProvider>
          </UserPreferencesProvider>
        </ThemeProvider>
      </AuthorizationProvider>
    </BrowserRouter>
  );
}

export default App;