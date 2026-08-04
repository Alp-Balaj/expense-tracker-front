/**
 * Cycle U W1 — the shared pot, before there is any money in it.
 *
 * Nothing here carries an amount, and that is the wave's boundary rather than
 * an oversight: balances, positions and shares arrive in W2 with the invariant
 * that keeps them honest. The one number a pot has today is the low-balance
 * threshold, which is a setting, not money.
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
