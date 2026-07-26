import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import { PageHeader } from "@/Components/General/PageHeader";
import { QuickActions } from "@/Components/Dashboard/QuickActions";
import { BalanceOverview } from "@/Components/Dashboard/BalanceOverview";
import { RecentActivity } from "@/Components/Dashboard/RecentActivity";
import { AccountBalances } from "@/Components/Dashboard/AccountBalances";
import { UpcomingExpenses } from "@/Components/Dashboard/UpcomingExpenses";
import ExpenseFormModal from "@/Components/Forms/ExpenseForm";
import IncomeFormModal from "@/Components/Income/IncomeFormModal";
import SavingsGoalFormModal from "@/Components/Saving/SavingsGoalFormModal";
import { LayoutDashboard } from "lucide-react";
import type { Account } from "@/Models/Account";
import type { Expense } from "@/Models/Expense";
import type { Income } from "@/Models/Income";
import type { FutureExpense } from "@/Models/FutureExpense";
import type { Category } from "@/Models/Category";
import type { AddSavingsGoal } from "@/Models/SavingGoals";
import { SAVING_GOAL_API } from "@/Services/api";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";

export default function HomePage() {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData, postData } = useAuthorizationApi();

  // ── Data state ──────────────────────────────────────────────
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [futureExpenses, setFutureExpenses] = useState<FutureExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Modal state ─────────────────────────────────────────────
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [savingsOpen, setSavingsOpen] = useState(false);

  // ── Fetch helpers ───────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [accs, exps, incs, fexps, cats] = await Promise.all([
        getAllData<Account[]>("api/Account"),
        getAllData<Expense[]>("api/Expense"),
        getAllData<Income[]>("api/Income"),
        getAllData<FutureExpense[]>("api/FutureExpense"),
        getAllData<Category[]>("api/Category"),
      ]);
      setAccounts(accs);
      setExpenses(exps);
      setIncomes(incs);
      setFutureExpenses(fexps);
      setCategories(cats);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [getAllData]);

  useEffect(() => {
    if (!isAuthReady || !accessToken) return;
    let cancelled = false;
    (async () => {
      await fetchAll();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, accessToken, fetchAll]);

  // #region ── Submit handlers ─────────────────────────────────────────
  const handleExpenseSubmit = async (data: Expense) => {
    try {
      await postData("api/Expense", data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to add expense."));
      throw e; // the modal keeps itself open
    }
    toast.success("Expense added");
    setExpenseOpen(false);
    await fetchAll();
  };

  const handleIncomeSubmit = async (data: Income) => {
    try {
      await postData("api/Income", data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to add income."));
      throw e; // the modal keeps itself open
    }
    toast.success("Income added");
    setIncomeOpen(false);
    await fetchAll();
  };

  const handleSavingsSubmit = async (data: AddSavingsGoal) => {
    try {
      await postData(SAVING_GOAL_API, data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to add savings goal."));
      throw e; // the modal keeps itself open
    }
    toast.success("Savings goal added");
    setSavingsOpen(false);
    await fetchAll();
  };

  // #endregion
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Dashboard"
        icon={<LayoutDashboard className="h-5 w-5 text-primary" />}
      />

      <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Quick Actions + Balance Overview */}
        <div className="grid gap-4 lg:grid-cols-5 items-stretch">
          <QuickActions
            onAddExpense={() => setExpenseOpen(true)}
            onAddIncome={() => setIncomeOpen(true)}
            onAddSavingsGoal={() => setSavingsOpen(true)}
            onAddFutureExpense={() => 0}
          />
          <div className="lg:col-span-4 h-full">
            <BalanceOverview
              accounts={accounts}
              expenses={expenses}
              incomes={incomes}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Main content: Activity + Sidebar */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Recent Activity - takes 3 columns */}
          <div className="lg:col-span-3">
            <RecentActivity
              expenses={expenses}
              incomes={incomes}
              accounts={accounts}
              categories={categories}
              isLoading={isLoading}
            />
          </div>

          {/* Right sidebar - takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <AccountBalances accounts={accounts} isLoading={isLoading} />
            <UpcomingExpenses
              futureExpenses={futureExpenses}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>

      {/* Form Modals */}
      <ExpenseFormModal
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        onSubmit={handleExpenseSubmit}
        onCancel={() => setExpenseOpen(false)}
      />

      <IncomeFormModal
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        onSubmit={handleIncomeSubmit}
        onCancel={() => setIncomeOpen(false)}
      />

      <SavingsGoalFormModal
        open={savingsOpen}
        onOpenChange={setSavingsOpen}
        onSubmit={handleSavingsSubmit}
        onCancel={() => setSavingsOpen(false)}
      />
    </div>
  );
}
