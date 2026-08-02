import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  PiggyBank,
  Plus,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/Components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Eyebrow } from "@/Components/Dashboard/Panel";
import { SafeToSpend } from "@/Components/Dashboard/SafeToSpend";
import { SpendCalendar } from "@/Components/Dashboard/SpendCalendar";
import { RecentActivity } from "@/Components/Dashboard/RecentActivity";
import { UpcomingExpenses } from "@/Components/Dashboard/UpcomingExpenses";
import { RecurringSpend } from "@/Components/Dashboard/RecurringSpend";
import { InsightsPanel } from "@/Components/Dashboard/InsightsPanel";
import { CashflowPanel } from "@/Components/Dashboard/CashflowPanel";
import CommitOccurrenceDialog from "@/Components/Planned/CommitOccurrenceDialog";
import { useQuickLog } from "@/Components/Layout/useQuickLog";

import type { CommitOccurrence, PlannedOccurrence } from "@/Models/PlannedTransaction";
import { getApiErrorMessage } from "@/lib/errors";

import { useAuth } from "@/Authorization/AuthContext";
import { useCurrency } from "@/Hooks/useCurrency";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";
import { useExpensesQuery } from "@/Hooks/queries/useExpenses";
import { useIncomesQuery } from "@/Hooks/queries/useIncomes";
import {
  useCommitOccurrence,
  usePlannedOccurrencesQuery,
  usePlannedTransactionsQuery,
} from "@/Hooks/queries/usePlannedTransactions";
import { useBudgetStatusQuery } from "@/Hooks/queries/useBudgets";
import { useInsightsQuery } from "@/Hooks/queries/useInsights";
import { useCashflowProjectionQuery } from "@/Hooks/queries/useCashflow";
import { currentMonth, formatMonth, overallBudgetStatus, shiftMonth } from "@/lib/budget";
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
  const { convert } = useCurrency();
  const { logExpense, logIncome, logSaving, logTransfer } = useQuickLog();

  // The dashboard's widgets are month-shaped by design — the budget status is
  // fetched per month, the calendar is a month grid — so this steps by whole
  // months rather than taking the free-form period the list pages use.
  const [month, setMonth] = useState(currentMonth());
  const isCurrentMonth = month === currentMonth();

  const [confirming, setConfirming] = useState<PlannedOccurrence | null>(null);
  const commitOccurrence = useCommitOccurrence();

  const handleConfirm = async (id: string, commit: CommitOccurrence) => {
    try {
      await commitOccurrence.mutateAsync({ id, commit });
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to confirm."));
      throw e; // keeps the dialog open so the user can correct it
    }
    toast.success("Recorded");
    setConfirming(null);
  };

  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccountsQuery();
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpensesQuery();
  const { data: incomes = [], isLoading: isLoadingIncomes } = useIncomesQuery();
  const { data: occurrences = [], isLoading: isLoadingOccurrences } =
    usePlannedOccurrencesQuery();
  const { data: plans = [] } = usePlannedTransactionsQuery();
  const { data: categories = [], isLoading: isLoadingCategories } = useCategoriesQuery();
  const { data: budgetStatuses = [], isLoading: isLoadingBudgets } =
    useBudgetStatusQuery(month);
  // Server-computed panels: always about the current month, wherever the
  // month cursor stands — like the recurring widget, they answer "now".
  const { data: insights, isLoading: isLoadingInsights } = useInsightsQuery();
  const { data: cashflow, isLoading: isLoadingCashflow } = useCashflowProjectionQuery();

  const isLoading =
    isLoadingAccounts ||
    isLoadingExpenses ||
    isLoadingIncomes ||
    isLoadingOccurrences ||
    isLoadingCategories;

  // ⌘E / Ctrl+E logs an expense from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "e") {
        event.preventDefault();
        logExpense();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [logExpense]);

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

  // #endregion

  return (
    <>
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
            <div className="flex items-center rounded-md border border-border">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous month"
                onClick={() => setMonth(shiftMonth(month, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[6.5rem] text-center text-sm font-medium text-foreground">
                {formatMonth(month)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next month"
                // Nothing is logged in the future; stepping past today would
                // only ever show an empty dashboard.
                disabled={isCurrentMonth}
                onClick={() => setMonth(shiftMonth(month, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More ways to log">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={logIncome}>
                  <TrendingUp className="h-4 w-4" />
                  Add income
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logSaving}>
                  <PiggyBank className="h-4 w-4" />
                  New savings goal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logTransfer}>
                  <ArrowLeftRight className="h-4 w-4" />
                  Transfer between accounts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button className="hidden sm:inline-flex" onClick={logExpense}>
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

          <div className="order-3 lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-2 lg:self-start">
            <RecentActivity
              expenses={expenses}
              incomes={incomes}
              accounts={accounts}
              categories={categories}
              isLoading={isLoading}
            />
          </div>

          <div className="order-2 lg:col-span-5 lg:col-start-8 lg:row-start-2">
            <UpcomingExpenses
              occurrences={occurrences}
              plans={plans}
              isLoading={isLoading}
              onConfirm={setConfirming}
            />
          </div>

          <div className="order-5 lg:col-span-5 lg:col-start-8 lg:row-start-3">
            <RecurringSpend expenses={expenses} isLoading={isLoading} />
          </div>

          <div className="order-6 lg:col-span-7 lg:col-start-1 lg:row-start-4">
            <CashflowPanel projection={cashflow} isLoading={isLoadingCashflow} />
          </div>

          <div className="order-7 lg:col-span-5 lg:col-start-8 lg:row-start-4">
            <InsightsPanel insights={insights} isLoading={isLoadingInsights} />
          </div>
        </div>
      </main>

      {/*
        The one action the dashboard exists to make easy. Phones get the tab
        bar's centre button instead, so this only shows from md up.
      */}
      <Button
        onClick={logExpense}
        aria-label="Log expense"
        className="fixed right-5 bottom-5 z-30 hidden size-14 rounded-2xl shadow-lg md:inline-flex lg:right-8 lg:bottom-8"
      >
        <Plus className="size-6" />
      </Button>

      {/*
        Confirming a due bill without leaving the dashboard — the one-click post
        the "Coming up" widget offers. Same dialog the Planned page uses, so the
        rules about amount, account and date are stated in exactly one place.
      */}
      <CommitOccurrenceDialog
        occurrence={confirming}
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        onSubmit={handleConfirm}
      />
    </>
  );
}
