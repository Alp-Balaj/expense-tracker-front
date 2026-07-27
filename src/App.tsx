import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/LoginPage";
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

function App() {
  return (
    <BrowserRouter>
      <AuthorizationProvider>
        <ThemeProvider defaultTheme="light">
          <UserPreferencesProvider>
            <SidebarProvider>
              <AxiosAuthBridge />
              <Toaster richColors position="top-right" />
              <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected */}
                <Route element={<RequireAuth />}>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/expenses" element={<ExpensePage />} />
                    <Route path="/income" element={<IncomePage />} />
                    <Route path="/categoryAndCurrency" element={<CategoryAndCurrencyPage />} />
                    <Route path="/savings" element={<SavingPage />} />
                    <Route path="/budgets" element={<BudgetPage />} />
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