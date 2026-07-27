import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import ExpenseFormModal from "@/Components/Forms/ExpenseForm";
import IncomeFormModal from "@/Components/Income/IncomeFormModal";
import SavingsGoalFormModal from "@/Components/Saving/SavingsGoalFormModal";
import { useCreateExpense } from "@/Hooks/queries/useExpenses";
import { useCreateIncome } from "@/Hooks/queries/useIncomes";
import { useCreateSavingGoal } from "@/Hooks/queries/useSavingGoals";
import type { Expense } from "@/Models/Expense";
import type { Income } from "@/Models/Income";
import type { AddSavingsGoal } from "@/Models/SavingGoals";
import { getApiErrorMessage } from "@/lib/errors";
import { QuickLogContext, type QuickLogValue } from "./useQuickLog";

/**
 * Owns the expense, income and savings-goal modals so the tab bar's centre
 * button, the nav sheet's quick-log row and the dashboard all open the same
 * instance rather than each keeping their own copy.
 */
export function QuickLogProvider({ children }: { children: ReactNode }) {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [savingsOpen, setSavingsOpen] = useState(false);

  const createExpense = useCreateExpense();
  const createIncome = useCreateIncome();
  const createSavingGoal = useCreateSavingGoal();

  const value = useMemo<QuickLogValue>(
    () => ({
      logExpense: () => setExpenseOpen(true),
      logIncome: () => setIncomeOpen(true),
      logSaving: () => setSavingsOpen(true),
    }),
    [],
  );

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

  return (
    <QuickLogContext.Provider value={value}>
      {children}

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
    </QuickLogContext.Provider>
  );
}
