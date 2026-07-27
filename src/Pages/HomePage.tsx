import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ellipsis, PiggyBank, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/Components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { DashboardTopBar } from "@/Components/Dashboard/DashboardTopBar";
import { Eyebrow } from "@/Components/Dashboard/Panel";
import { SafeToSpend } from "@/Components/Dashboard/SafeToSpend";
import { SpendCalendar } from "@/Components/Dashboard/SpendCalendar";
import { RecentActivity } from "@/Components/Dashboard/RecentActivity";
import { UpcomingExpenses } from "@/Components/Dashboard/UpcomingExpenses";
import { RecurringSpend } from "@/Components/Dashboard/RecurringSpend";
import { BudgetOverview } from "@/Components/Dashboard/BudgetOverview";
import ExpenseFormModal from "@/Components/Forms/ExpenseForm";
import IncomeFormModal from "@/Components/Income/IncomeFormModal";
import SavingsGoalFormModal from "@/Components/Saving/SavingsGoalFormModal";

import type { Expense } from "@/Models/Expense";
import type { Income } from "@/Models/Income";
import type { AddSavingsGoal } from "@/Models/SavingGoals";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuth } from "@/Authorization/AuthContext";
import { useCurrency } from "@/Hooks/useCurrency";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";
import { useExpensesQuery, useCreateExpense } from "@/Hooks/queries/useExpenses";
import { useIncomesQuery, useCreateIncome } from "@/Hooks/queries/useIncomes";
import { useFutureExpensesQuery } from "@/Hooks/queries/useFutureExpenses";
import { useBudgetStatusQuery } from "@/Hooks/queries/useBudgets";
import { useCreateSavingGoal } from "@/Hooks/queries/useSavingGoals";
import { currentMonth, formatMonth, overallBudgetStatus } from "@/lib/budget";
import { monthKey } from "@/lib/dates";
import {
  cashRunwayDays,
  dailyBurn,
  greeting,
  liquidPosition,
  monthCursor,
} from "@/lib/dashboard";

export default function HomePage() {
  const navigate = useNavigate();
  const { username } = useAuth();
  const { format, convert, userCurrencyCode } = useCurrency();

  const month = currentMonth();

  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccountsQuery();
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpensesQuery();
  const { data: incomes = [], isLoading: isLoadingIncomes } = useIncomesQuery();
  const { data: futureExpenses = [], isLoading: isLoadingFutureExpenses } =
    useFutureExpensesQuery();
  const { data: categories = [], isLoading: isLoadingCategories } = useCategoriesQuery();
  const { data: budgetStatuses = [], isLoading: isLoadingBudgets } =
    useBudgetStatusQuery(month);

  const isLoading =
    isLoadingAccounts ||
    isLoadingExpenses ||
    isLoadingIncomes ||
    isLoadingFutureExpenses ||
    isLoadingCategories;

  const createExpense = useCreateExpense();
  const createIncome = useCreateIncome();
  const createSavingGoal = useCreateSavingGoal();

  // ── Modal state ─────────────────────────────────────────────
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [savingsOpen, setSavingsOpen] = useState(false);

  // ⌘E / Ctrl+E logs an expense from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "e") {
        event.preventDefault();
        setExpenseOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // #region ── Derived figures ─────────────────────────────────────────
  const cursor = useMemo(() => monthCursor(month), [month]);

  const thisMonth = useMemo(
    () => ({
      expenses: expenses.filter((e) => monthKey(e.date) === month),
      incomes: incomes.filter((i) => monthKey(i.date) === month),
    }),
    [expenses, incomes, month],
  );

  const spentThisMonth = useMemo(
    () => thisMonth.expenses.reduce((sum, e) => sum + e.amount, 0),
    [thisMonth],
  );
  const netThisMonth = useMemo(
    () => thisMonth.incomes.reduce((sum, i) => sum + i.amount, 0) - spentThisMonth,
    [thisMonth, spentThisMonth],
  );

  const overall = useMemo(() => overallBudgetStatus(budgetStatuses), [budgetStatuses]);

  const liquid = useMemo(
    () => liquidPosition(accounts, convert),
    // convert closes over the currency table, which changes with the query;
    // accounts changing is the signal that matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accounts],
  );
  const runwayDays = useMemo(
    () => cashRunwayDays(liquid.total, dailyBurn(expenses)),
    [liquid.total, expenses],
  );

  const monthLabel = formatMonth(month).split(" ")[0];
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const readout = overall
    ? {
        amount: format(overall.remaining, userCurrencyCode),
        caption: `left · ${cursor.daysLeft}d`,
      }
    : { amount: format(spentThisMonth, userCurrencyCode), caption: `spent · ${monthLabel}` };
  // #endregion

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
    <div className="min-h-screen bg-[oklch(0.985_0.004_75)] dark:bg-background">
      <DashboardTopBar readout={readout} />

      <main className="px-4 pt-5 pb-24 sm:px-6 lg:px-10 lg:pt-8 lg:pb-28">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>{dateLabel}</Eyebrow>
            <h2 className="mt-1 truncate text-2xl font-bold tracking-tight text-foreground lg:text-[26px]">
              {greeting()}
              {username ? `, ${username}` : ""}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More ways to log">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIncomeOpen(true)}>
                  <TrendingUp className="h-4 w-4" />
                  Add income
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSavingsOpen(true)}>
                  <PiggyBank className="h-4 w-4" />
                  New savings goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button className="hidden sm:inline-flex" onClick={() => setExpenseOpen(true)}>
              <Plus className="h-4 w-4" />
              Log expense
              <kbd className="ml-0.5 font-mono text-[10px] opacity-65">⌘E</kbd>
            </Button>
          </div>
        </div>

        {/*
          One grid for both breakpoints: a flex column on phones, where the
          order-* classes set the reading order, and a 12-column layout from
          lg up, where each panel is placed explicitly.
        */}
        <div className="mt-4 flex flex-col gap-4 lg:mt-5 lg:grid lg:grid-cols-12">
          <div className="order-1 lg:col-span-8 lg:col-start-1 lg:row-start-1">
            <SafeToSpend
              monthLabel={monthLabel}
              daysLeft={cursor.daysLeft}
              elapsed={cursor.elapsed}
              budget={overall}
              spentThisMonth={spentThisMonth}
              netThisMonth={netThisMonth}
              liquid={liquid}
              runwayDays={runwayDays}
              isLoading={isLoading || isLoadingBudgets}
              onSetBudget={() => navigate("/budgets")}
            />
          </div>

          <div className="order-4 lg:col-span-4 lg:col-start-9 lg:row-start-1">
            <SpendCalendar expenses={expenses} month={month} isLoading={isLoading} />
          </div>

          <div className="order-3 lg:col-span-7 lg:col-start-1 lg:row-span-3 lg:row-start-2 lg:self-start">
            <RecentActivity
              expenses={expenses}
              incomes={incomes}
              accounts={accounts}
              categories={categories}
              isLoading={isLoading}
            />
          </div>

          <div className="order-2 lg:col-span-5 lg:col-start-8 lg:row-start-2">
            <UpcomingExpenses futureExpenses={futureExpenses} isLoading={isLoading} />
          </div>

          <div className="order-5 lg:col-span-5 lg:col-start-8 lg:row-start-3">
            <RecurringSpend expenses={expenses} isLoading={isLoading} />
          </div>

          <div className="order-6 lg:col-span-5 lg:col-start-8 lg:row-start-4">
            <BudgetOverview statuses={budgetStatuses} isLoading={isLoadingBudgets} />
          </div>
        </div>
      </main>

      {/* The one action the dashboard exists to make easy. */}
      <Button
        onClick={() => setExpenseOpen(true)}
        aria-label="Log expense"
        className="fixed right-5 bottom-5 z-30 size-14 rounded-2xl shadow-lg lg:right-8 lg:bottom-8"
      >
        <Plus className="size-6" />
      </Button>

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
