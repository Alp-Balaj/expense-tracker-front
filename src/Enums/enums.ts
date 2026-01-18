export const AmountType = {
  Cash: 0,
  Bank: 1,
} as const;

export type AmountType = typeof AmountType[keyof typeof AmountType];

export const CategoryType = {
  Expense: 0,
  Income: 1,
  Savings: 2,
  FutureExpense: 3,
} as const;

export type CategoryType = typeof CategoryType[keyof typeof CategoryType];