/**
 * Cycle U — the shared pot.
 *
 * W1 shipped the group; W2 puts money in it, with the identity that keeps it
 * honest:
 *
 *     Bi = topups + outOfPocket − shares − withdrawals
 *     Σ Bi ≡ pot cash balance
 *
 * **Every amount in this file is in the pot's currency and is never
 * converted.** A group screen that converted would show four members four
 * different numbers for one bill. The personal side — budgets, category totals
 * — does convert, through each member's own rates, and that happens on the
 * server.
 *
 * Settlements, positions owed between members and the pot inbox are W3's and
 * are deliberately absent.
 */

/** Mirrors PotActivityKind on the server. Values are the wire format — do not renumber. */
export const PotActivityKind = {
  PotCreated: 0,
  PotRenamed: 1,
  LowBalanceThresholdChanged: 2,
  InviteCreated: 3,
  InviteRevoked: 4,
  MemberJoined: 5,
  MemberLeft: 6,
  MemberAnonymized: 7,
  ToppedUp: 8,
  ExpenseLogged: 9,
  ExpenseDeleted: 10,
  Withdrew: 11,
} as const;

export type PotActivityKindValue =
  (typeof PotActivityKind)[keyof typeof PotActivityKind];

export interface Pot {
  id: string;
  name: string;
  currencyCode: string;
  lowBalanceThreshold: number;
  createdAt: string;
  /** Null once the creator has deleted their account. */
  createdByDisplayName: string | null;
  memberCount: number;
  /** The reading member's own membership — what the UI marks as "you". */
  membershipId: string;
  /** W2: the cash in the pot, in `currencyCode`. */
  balance: number;
  /** W2: `topups + outOfPocket − shares − withdrawals` for the reader. */
  yourPosition: number;
  /** W2: below the pot's threshold. The alert that acts on it is W4's. */
  isLow: boolean;
}

export interface CreatePot {
  name: string;
  /** Omitted means EUR, which is the only currency this cycle uses. */
  currencyCode?: string | null;
  /** Omitted means 50. Zero switches the alert off. */
  lowBalanceThreshold?: number | null;
}

export interface UpdatePot {
  name: string;
  lowBalanceThreshold: number;
}

export interface PotMember {
  id: string;
  displayName: string;
  joinedAt: string;
  leftAt: string | null;
  isActive: boolean;
  isAnonymized: boolean;
  isYou: boolean;
}

export interface PotInvite {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  issuedByDisplayName: string;
  revokedByDisplayName: string | null;
  /** Decided by the server, so the badge never disagrees with what redeeming does. */
  isRedeemable: boolean;
  hasExpired: boolean;
}

/** All a link discloses to somebody who is not a member yet. */
export interface PotInvitePreview {
  potName: string;
  currencyCode: string;
  invitedByDisplayName: string;
  isRedeemable: boolean;
  alreadyAMember: boolean;
  problem: string | null;
}

export interface PotActivity {
  id: string;
  kind: PotActivityKindValue;
  actorDisplayName: string | null;
  targetId: string | null;
  targetLabel: string | null;
  before: string | null;
  after: string | null;
  occurredAt: string;
}

// ── W2, the ledger ──────────────────────────────────────────────────────────

/** Mirrors PotLedgerEntryKind on the server. Wire format — do not renumber. */
export const PotLedgerEntryKind = {
  TopUp: 0,
  Expense: 1,
  Withdrawal: 2,
} as const;

export type PotLedgerEntryKindValue =
  (typeof PotLedgerEntryKind)[keyof typeof PotLedgerEntryKind];

/**
 * One member's standing against the pot: the four terms as well as the answer,
 * because "you are €12.40 down" is only trustworthy next to the arithmetic that
 * produced it.
 */
export interface PotPosition {
  membershipId: string;
  displayName: string;
  isYou: boolean;
  /** False for a member who has left. Their history stays in the sum. */
  isActive: boolean;
  toppedUp: number;
  outOfPocket: number;
  shares: number;
  withdrawn: number;
  /** `toppedUp + outOfPocket − shares − withdrawn`. Positive means the pot owes you. */
  position: number;
  /** Your position, capped at the cash actually in the pot. Server-decided. */
  withdrawable: number;
}

export interface PotShare {
  membershipId: string;
  displayName: string;
  isYou: boolean;
  amount: number;
}

export interface PotLedgerEntry {
  id: string;
  kind: PotLedgerEntryKindValue;
  /** "yyyy-MM-dd". */
  date: string;
  createdAt: string;
  amount: number;
  /** The expense's title, or the note on a top-up or withdrawal. */
  title: string | null;
  description: string | null;
  actorDisplayName: string | null;
  actorMembershipId: string | null;
  /** On an expense: the member who fronted it, or null when the pot paid. */
  paidByDisplayName: string | null;
  paidByMembershipId: string | null;
  shares: PotShare[];
  /**
   * Whether the reader may delete this line. Only expenses can be, and a
   * fronted one only by the member whose account has to be credited back.
   */
  canDelete: boolean;
}

/**
 * The whole money screen in one read. Fetched together on purpose: the balance,
 * the positions and the feed are three views of the same rows, and separately
 * they could disagree on the way down the wire — which is exactly the failure
 * this wave exists to make impossible.
 */
export interface PotLedger {
  potId: string;
  currencyCode: string;
  balance: number;
  isLow: boolean;
  positions: PotPosition[];
  entries: PotLedgerEntry[];
}

export interface CreatePotTopUp {
  amount: number;
  sourceAccountId: string;
  date?: string | null;
  note?: string | null;
}

export interface CreatePotWithdrawal {
  amount: number;
  destinationAccountId: string;
  date?: string | null;
  note?: string | null;
}

/**
 * One participant on a pot expense. A null `amount` means "take an even slice
 * of what the typed amounts leave behind" — which is what "everyone", "a
 * subset" and "just one person" all send. The server allocates by largest
 * remainder in integer cents so the shares add up to the expense exactly.
 */
export interface PotExpenseShareInput {
  membershipId: string;
  amount: number | null;
}

export interface CreatePotExpense {
  title: string;
  description?: string | null;
  amount: number;
  date?: string | null;
  /**
   * Null means the pot paid, which is the ordinary case. Set to one of *your
   * own* accounts to record that you fronted it — there is no way to say that
   * somebody else did, because recording it moves a real account balance.
   */
  paidFromAccountId?: string | null;
  shares: PotExpenseShareInput[];
}
