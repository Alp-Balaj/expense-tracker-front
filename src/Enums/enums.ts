export const AmountType = {
  CheckingAccount: 0,
  SavingsAccount: 1,
  Cash: 2,
  CreditCard: 3,
  Investment: 4
} as const;

export type AmountType = typeof AmountType[keyof typeof AmountType];

/**
 * There is deliberately no "planned" type: a planned expense uses the same
 * Expense categories a hand-typed one does, so committing it lands in the budget
 * and the report you already have. The retired value 3 (FutureExpense) was
 * folded into Expense by the PlannedTransactions migration.
 */
export const CategoryType = {
  Expense: 0,
  Income: 1,
  Savings: 2,
} as const;

export type CategoryType = typeof CategoryType[keyof typeof CategoryType];

export const TransactionKind = {
  Expense: 0,
  Income: 1
} as const;

export type TransactionKind = typeof TransactionKind[keyof typeof TransactionKind]

/** What a planned transaction becomes once you confirm it. */
export const PlannedKind = {
  Expense: 0,
  Income: 1,
  Transfer: 2,
} as const;

export type PlannedKind = typeof PlannedKind[keyof typeof PlannedKind];

/** How often it comes round. `Once` is a single future-dated payment. */
export const Recurrence = {
  Once: 0,
  Weekly: 1,
  Monthly: 2,
  Yearly: 3,
} as const;

export type Recurrence = typeof Recurrence[keyof typeof Recurrence];

export const PlannedOccurrenceState = {
  Pending: 0,
  Committed: 1,
  Skipped: 2,
} as const;

export type PlannedOccurrenceState =
  typeof PlannedOccurrenceState[keyof typeof PlannedOccurrenceState];