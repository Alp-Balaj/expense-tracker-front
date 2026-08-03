// Matches the backend's ReimbursementDTO (GET /api/Reimbursement): what is
// still owed to you on a split expense, plus the settlements recorded so far.
//
// A receivable is deliberately amount-only — there is no debtor, no name and no
// contact anywhere in this feature. "Who owes it" is something the user knows;
// the app only tracks how much is out and how long it has been out.

export type ReimbursementSettlement = {
  id: string;
  /** The account the money was paid back into. */
  accountId: string;
  accountName: string;
  amount: number;
  /** yyyy-MM-dd. */
  date: string;
};

export type Reimbursement = {
  id: string;
  expenseId: string;
  expenseTitle: string;
  /** yyyy-MM-dd — the expense's date, which is what the age is measured from. */
  expenseDate: string;
  /** The gross bill: what actually left the account. */
  expenseAmount: number;
  /** What others owe you in total. */
  expectedAmount: number;
  /** Σ of the settlements below. */
  settledAmount: number;
  /** expected − settled: what is still out. */
  openAmount: number;
  /** The expense account's currency; settlements share it. */
  currencyCode: string;
  /** Whole days between the expense's date and today, server-computed. */
  daysOpen: number;
  settlements: ReimbursementSettlement[];
};

/** Body of POST /api/Reimbursement/{id}/settlements. */
export type SettleReimbursement = {
  /** Any account the user owns — chosen at settle time, not fixed up front. */
  accountId: string;
  amount: number;
  /** yyyy-MM-dd. */
  date: string;
};
