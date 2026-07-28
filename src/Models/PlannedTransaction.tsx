import type { PlannedKind, PlannedOccurrenceState, Recurrence } from "@/Enums/enums";

/**
 * Money you already know is coming: rent, a subscription, a salary, the standing
 * order into savings, or a single future-dated payment.
 *
 * A template never touches a balance. Reading the planned data materialises each
 * due date as a {@link PlannedOccurrence}, and only confirming one of those
 * creates a real expense, income or transfer — with the amount, account and date
 * you actually confirm, because the due date is only ever a prediction.
 *
 * Replaces the old `FutureExpense`, which was expense-only, carried no account,
 * and used a category axis nothing posted could belong to.
 */
export type PlannedTransaction = {
  id: string | null;
  title: string;
  /** What it usually costs. Pre-fills the confirm dialog; not what gets posted. */
  amount: number;
  description: string | null;
  kind: PlannedKind;
  /** Required for expense and income (matching the kind); null for a transfer. */
  categoryId: string | null;
  /** Debited account. Only a default — the confirm dialog can change it. */
  fromAccountId: string | null;
  /** Credited account. Only a default — the confirm dialog can change it. */
  toAccountId: string | null;
  /** Transfers only: the goal a confirmed transfer contributes to. */
  savingGoalId: string | null;
  recurrence: Recurrence;
  /** First due date, and the anchor every later one is derived from. */
  startDate: string;
  endDate: string | null;
  isActive: boolean;

  // Server-computed, read-only.

  /** When it next comes round. Null once finished or while paused. */
  nextDueDate: string | null;
  /** How many of its occurrences are still waiting to be dealt with. */
  pendingCount: number;
};

/** One due date of a template, waiting to be confirmed or skipped. */
export type PlannedOccurrence = {
  id: string;
  plannedTransactionId: string;
  periodKey: string;
  dueDate: string;
  state: PlannedOccurrenceState;
  committedAt: string | null;

  /** What it became. Exactly one is set once confirmed. */
  expenseId: string | null;
  incomeId: string | null;
  transferId: string | null;

  // Flattened from the template so the queue renders without a join.

  title: string;
  description: string | null;
  kind: PlannedKind;
  amount: number;
  categoryId: string | null;
  fromAccountId: string | null;
  toAccountId: string | null;
  savingGoalId: string | null;
};

/**
 * The confirm step: what actually happened, as opposed to what was planned.
 * Every field is optional and falls back to what the template said, so a bill
 * that went exactly as expected confirms on an empty body.
 */
export type CommitOccurrence = {
  amount?: number;
  date?: string;
  fromAccountId?: string;
  toAccountId?: string;
  /** Whether an overridden amount should also become the template's new expected amount. */
  updateTemplateAmount?: boolean;
};
