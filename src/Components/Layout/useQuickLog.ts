import { createContext, useContext } from "react";

export type QuickLogValue = {
  logExpense: () => void;
  logIncome: () => void;
  logSaving: () => void;
  logTransfer: () => void;
};

export const QuickLogContext = createContext<QuickLogValue | null>(null);

/** The four "add something" forms, opened from anywhere in the shell. */
export function useQuickLog(): QuickLogValue {
  const value = useContext(QuickLogContext);
  if (!value) throw new Error("useQuickLog must be used within a QuickLogProvider.");
  return value;
}
