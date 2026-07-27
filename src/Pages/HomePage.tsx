import { useState } from "react";
import { PageHeader } from "@/Components/General/PageHeader";
import { QuickActions } from "@/Components/Dashboard/QuickActions";
import { BalanceOverview } from "@/Components/Dashboard/BalanceOverview";
import { RecentActivity } from "@/Components/Dashboard/RecentActivity";
import { AccountBalances } from "@/Components/Dashboard/AccountBalances";
import { UpcomingExpenses } from "@/Components/Dashboard/UpcomingExpenses";
import { BudgetOverview } from "@/Components/Dashboard/BudgetOverview";
import ExpenseFormModal from "@/Components/Forms/ExpenseForm";
import IncomeFormModal from "@/Components/Income/IncomeFormModal";
import SavingsGoalFormModal from "@/Components/Saving/SavingsGoalFormModal";
import { LayoutDashboard } from "lucide-react";
import type { Expense } from "@/Models/Expense";
import type { Income } from "@/Models/Income";
import type { AddSavingsGoal } from "@/Models/SavingGoals";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";
import { useExpensesQuery, useCreateExpense } from "@/Hooks/queries/useExpenses";
import { useIncomesQuery, useCreateIncome } from "@/Hooks/queries/useIncomes";
import { useFutureExpensesQuery } from "@/Hooks/queries/useFutureExpenses";
import { useCreateSavingGoal } from "@/Hooks/queries/useSavingGoals";

export default function HomePage() {
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccountsQuery();
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpensesQuery();
  const { data: incomes = [], isLoading: isLoadingIncomes } = useIncomesQuery();
  const { data: futureExpenses = [], isLoading: isLoadingFutureExpenses } = useFutureExpensesQuery();
  const { data: categories = [], isLoading: isLoadingCategories } = useCategoriesQuery();
  const isLoading =
    isLoadingAccounts || isLoadingExpenses || isLoadingIncomes || isLoadingFutureExpenses || isLoadingCategories;

  const createExpense = useCreateExpense();
  const createIncome = useCreateIncome();
  const createSavingGoal = useCreateSavingGoal();

  // ── Modal state ─────────────────────────────────────────────
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [savingsOpen, setSavingsOpen] = useState(false);

  // #region ── Submit handlers ─────────────────────────────────────────
  const handleExpenseSubmit = async (data: Expense) => {
    try {
      await createExpense.mutateAsync(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to add expense."));
      throw e; // the modal keeps itself open
    }
    toast.success("Expense added");
    setExpenseOpen(false);
  };

  const handleIncomeSubmit = async (data: Income) => {
    try {
      await createIncome.mutateAsync(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to add income."));
      throw e; // the modal keeps itself open
    }
    toast.success("Income added");
    setIncomeOpen(false);
  };

  const handleSavingsSubmit = async (data: AddSavingsGoal) => {
    try {
      await createSavingGoal.mutateAsync(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to add savings goal."));
      throw e; // the modal keeps itself open
    }
    toast.success("Savings goal added");
    setSavingsOpen(false);
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
            <BudgetOverview />
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
