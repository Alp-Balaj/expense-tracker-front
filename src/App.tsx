import { Suspense, lazy, type CSSProperties } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import LoginPage from "./Pages/LoginPage";

import { AuthorizationProvider } from "./Authorization/AuthContext";
import RequireAuth from "./Authorization/RequireAuthentication";
import AxiosAuthBridge from "./Authorization/AxiosAuthBridge";

import AppLayout from "./Components/Layout/AppLayout";
import { SidebarProvider } from "./Components/ui/sidebar";
import { UserPreferencesProvider } from "./Authorization/UserPreferencesContext";
import { ThemeProvider } from "./Components/Layout/ThemeProvider";
import LoadingSpinner from "./Components/General/LoadingSpinner";

/**
 * Suggestion-12: every page is loaded on demand.
 *
 * Every route used to be a static import, so opening /login downloaded the
 * whole application — including recharts, the report builder and the CSV import
 * screen — before it could render a password field. On a phone on mobile data
 * that is the first impression, and it is the one thing the installable PWA
 * Stream A shipped is selling.
 *
 * LoginPage is deliberately *not* lazy: it is the one route a signed-out visitor
 * is guaranteed to need, and splitting it would only add a round trip before the
 * first paint. Everything behind RequireAuth is split, because reaching it means
 * the shell is already up and a chunk fetch is invisible under the spinner.
 */
const HomePage = lazy(() => import("./Pages/HomePage"));
const ForgotPasswordPage = lazy(() => import("./Pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./Pages/ResetPasswordPage"));
const ConfirmEmailPage = lazy(() => import("./Pages/ConfirmEmailPage"));
const AccountPage = lazy(() => import("./Pages/AccountPage"));
const NotFoundPage = lazy(() => import("./Pages/NotFoundPage"));
const CategoryAndCurrencyPage = lazy(() => import("./Pages/CategoryAndCurrencyPage"));
const ReportsPage = lazy(() => import("./Pages/ReportPage"));
const IncomePage = lazy(() => import("./Pages/IncomePage"));
const ExpensePage = lazy(() => import("./Pages/ExpensePage"));
const SavingPage = lazy(() => import("./Pages/SavingPage"));
const BudgetPage = lazy(() => import("./Pages/BudgetPage"));
const PlannedPage = lazy(() => import("./Pages/PlannedPage"));
const AddExpensePage = lazy(() => import("./Pages/AddExpensePage"));
const DataPage = lazy(() => import("./Pages/DataPage"));
const PotsPage = lazy(() => import("./Pages/PotsPage"));
const PotDetailPage = lazy(() => import("./Pages/PotDetailPage"));
const JoinPotPage = lazy(() => import("./Pages/JoinPotPage"));

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
              {/* One boundary around the whole router rather than one per route:
                  a chunk fetch on a warm connection is a few milliseconds, and a
                  spinner per route would flicker on every navigation. */}
              <Suspense fallback={<LoadingSpinner />}>
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
                      <Route path="/data" element={<DataPage />} />
                      {/* Cycle U. /join/:code sits inside RequireAuth on
                          purpose: joining a pot is an act by a specific person,
                          so a signed-out visitor opening an invite link is sent
                          to login and returned here afterwards. */}
                      <Route path="/pots" element={<PotsPage />} />
                      <Route path="/pots/:potId" element={<PotDetailPage />} />
                      <Route path="/join/:code" element={<JoinPotPage />} />
                      <Route path="/savings" element={<SavingPage />} />
                      <Route path="/budgets" element={<BudgetPage />} />
                      <Route path="/planned" element={<PlannedPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                    </Route>
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </SidebarProvider>
          </UserPreferencesProvider>
        </ThemeProvider>
      </AuthorizationProvider>
    </BrowserRouter>
  );
}

export default App;
