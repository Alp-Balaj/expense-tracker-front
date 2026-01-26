export const AmountType = {
  CheckingAccount: 0,
  SavingsAccount: 1,
  Cash: 2,
  CreditCard: 3,
  Investment: 4
} as const;

export type AmountType = typeof AmountType[keyof typeof AmountType];

export const CategoryType = {
  Expense: 0,
  Income: 1,
  Savings: 2,
  FutureExpense: 3,
} as const;

export type CategoryType = typeof CategoryType[keyof typeof CategoryType];

export const TransactionKind = {
  Expense: 0,
  Income: 1
}

export type TransactionKind = typeof TransactionKind[keyof typeof TransactionKind]