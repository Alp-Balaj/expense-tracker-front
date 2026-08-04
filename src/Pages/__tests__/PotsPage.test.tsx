import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import PotsPage from "@/Pages/PotsPage";
import PotDetailPage from "@/Pages/PotDetailPage";
import * as potHooks from "@/Hooks/queries/usePots";
import {
  PotActivityKind,
  type Pot,
  type PotActivity,
  type PotLedger,
  type PotMember,
} from "@/Models/Pot";

// The pot's frontend contract from the reader's side: a pot has people in it, a
// history, and — from W2 — money. W1 pinned the last of those as *absent*,
// which was the wave boundary at the time; W2 moves that pin rather than
// dropping it, so what is now asserted absent is settlement.

vi.mock("@/Hooks/queries/usePots");
vi.mock("@/Hooks/queries/useAccounts", () => ({
  useAccountsQuery: () => ({ data: [{ id: "acc-1", name: "Main" }] }),
}));

function pot(overrides: Partial<Pot> = {}): Pot {
  return {
    id: "pot-1",
    name: "The Flat",
    currencyCode: "EUR",
    lowBalanceThreshold: 50,
    createdAt: "2026-08-04T10:00:00Z",
    createdByDisplayName: "AlpBalaj",
    memberCount: 2,
    membershipId: "mem-1",
    balance: 120,
    yourPosition: 40,
    isLow: false,
    ...overrides,
  };
}

function ledger(overrides: Partial<PotLedger> = {}): PotLedger {
  return {
    potId: "pot-1",
    currencyCode: "EUR",
    balance: 120,
    isLow: false,
    positions: [
      {
        membershipId: "mem-1",
        displayName: "AlpBalaj",
        isYou: true,
        isActive: true,
        toppedUp: 100,
        outOfPocket: 0,
        shares: 60,
        withdrawn: 0,
        position: 40,
        withdrawable: 40,
      },
      {
        membershipId: "mem-2",
        displayName: "MaraIonescu",
        isYou: false,
        isActive: true,
        toppedUp: 140,
        outOfPocket: 0,
        shares: 60,
        withdrawn: 0,
        position: 80,
        withdrawable: 80,
      },
    ],
    entries: [],
    ...overrides,
  };
}

function member(overrides: Partial<PotMember>): PotMember {
  return {
    id: "mem-1",
    displayName: "AlpBalaj",
    joinedAt: "2026-08-04T10:00:00Z",
    leftAt: null,
    isActive: true,
    isAnonymized: false,
    isYou: false,
    ...overrides,
  };
}

function activity(overrides: Partial<PotActivity>): PotActivity {
  return {
    id: "act-1",
    kind: PotActivityKind.PotCreated,
    actorDisplayName: "AlpBalaj",
    targetId: "pot-1",
    targetLabel: "The Flat",
    before: null,
    after: null,
    occurredAt: "2026-08-04T10:00:00Z",
    ...overrides,
  };
}

function mockDetail(options: {
  pot?: Pot | null;
  members?: PotMember[];
  activity?: PotActivity[];
  ledger?: PotLedger | null;
  isError?: boolean;
}) {
  vi.mocked(potHooks).usePotLedgerQuery.mockReturnValue({
    data: options.ledger === null ? undefined : (options.ledger ?? ledger()),
  } as never);
  vi.mocked(potHooks).usePotTopUp.mockReturnValue({ mutateAsync: vi.fn() } as never);
  vi.mocked(potHooks).useLogPotExpense.mockReturnValue({ mutateAsync: vi.fn() } as never);
  vi.mocked(potHooks).useDeletePotExpense.mockReturnValue({ mutateAsync: vi.fn() } as never);
  vi.mocked(potHooks).usePotWithdrawal.mockReturnValue({ mutateAsync: vi.fn() } as never);
  vi.mocked(potHooks).usePotQuery.mockReturnValue({
    data: options.pot ?? undefined,
    isLoading: false,
    isError: options.isError ?? false,
  } as never);
  vi.mocked(potHooks).usePotMembersQuery.mockReturnValue({
    data: options.members ?? [],
  } as never);
  vi.mocked(potHooks).usePotInvitesQuery.mockReturnValue({ data: [] } as never);
  vi.mocked(potHooks).usePotActivityQuery.mockReturnValue({
    data: options.activity ?? [],
  } as never);
  vi.mocked(potHooks).useUpdatePot.mockReturnValue({ mutateAsync: vi.fn() } as never);
  vi.mocked(potHooks).useLeavePot.mockReturnValue({ mutateAsync: vi.fn() } as never);
  vi.mocked(potHooks).useCreatePotInvite.mockReturnValue({ mutateAsync: vi.fn() } as never);
  vi.mocked(potHooks).useRevokePotInvite.mockReturnValue({ mutateAsync: vi.fn() } as never);
}

/**
 * Through the real route, not as a bare element: the page reads its id from
 * useParams, and rendering it without one puts it straight into the
 * not-available branch — which looks exactly like a passing test of the wrong
 * thing.
 */
function renderDetail() {
  return render(
    <MemoryRouter initialEntries={["/pots/pot-1"]}>
      <Routes>
        <Route path="/pots/:potId" element={<PotDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PotsPage", () => {
  it("tells a user in no pots what a pot is for, rather than showing an empty grid", () => {
    vi.mocked(potHooks).usePotsQuery.mockReturnValue({ data: [], isLoading: false } as never);
    vi.mocked(potHooks).useCreatePot.mockReturnValue({ mutateAsync: vi.fn() } as never);

    render(
      <MemoryRouter>
        <PotsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("You are not in any pots")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create a pot" })).toBeInTheDocument();
  });

  it("lists a pot by its people, its balance and where you stand against it", () => {
    vi.mocked(potHooks).usePotsQuery.mockReturnValue({
      data: [
        pot(),
        pot({
          id: "pot-2",
          name: "Ski trip",
          memberCount: 1,
          balance: 12.5,
          yourPosition: -30,
          isLow: true,
        }),
      ],
      isLoading: false,
    } as never);
    vi.mocked(potHooks).useCreatePot.mockReturnValue({ mutateAsync: vi.fn() } as never);

    render(
      <MemoryRouter>
        <PotsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("The Flat")).toBeInTheDocument();
    expect(screen.getByText(/2 members · €120\.00 in the pot/)).toBeInTheDocument();
    expect(screen.getByText("+€40.00 yours")).toBeInTheDocument();

    // Two facts, not one: a member can be down while the pot still has money,
    // and the list has to be able to say both at once.
    expect(screen.getByText(/1 member · €12\.50 in the pot · running low/)).toBeInTheDocument();
    expect(screen.getByText("−€30.00 yours")).toBeInTheDocument();
  });
});

describe("PotDetailPage", () => {
  it("shows the members in join order, marks you, and keeps people who left", () => {
    mockDetail({
      pot: pot(),
      members: [
        member({ id: "mem-1", displayName: "AlpBalaj", isYou: true }),
        member({
          id: "mem-2",
          displayName: "MaraIonescu",
          isActive: false,
          leftAt: "2026-08-04T12:00:00Z",
        }),
      ],
    });

    renderDetail();

    // getAllByText from W2 on: a member's name is now in two places on this
    // screen — the member list and the positions table — which is the point of
    // both of them.
    expect(screen.getAllByText("AlpBalaj").length).toBeGreaterThan(0);
    expect(screen.getByText("You")).toBeInTheDocument();

    // Somebody who left stays visible: the activity log goes on naming them,
    // so hiding them here would leave the history full of ghosts.
    expect(screen.getAllByText("MaraIonescu").length).toBeGreaterThan(0);
    expect(screen.getByText(/1 person in this pot, 1 who left/)).toBeInTheDocument();
  });

  it("names an anonymized member without pretending they were never there", () => {
    mockDetail({
      pot: pot({ createdByDisplayName: null }),
      members: [
        member({ id: "mem-1", displayName: "AlpBalaj", isYou: true }),
        member({
          id: "mem-2",
          displayName: "Former member",
          isActive: false,
          isAnonymized: true,
          leftAt: "2026-08-04T12:00:00Z",
        }),
      ],
    });

    renderDetail();

    expect(screen.getByText("Former member")).toBeInTheDocument();
    expect(
      screen.getByText("Account deleted — their share of the history stays"),
    ).toBeInTheDocument();
  });

  it("reads the activity log as sentences, with the before and after of a change", () => {
    mockDetail({
      pot: pot(),
      members: [member({ isYou: true })],
      activity: [
        activity({
          id: "act-2",
          kind: PotActivityKind.PotRenamed,
          before: "Flat",
          after: "The Flat",
        }),
        activity({ id: "act-3", kind: PotActivityKind.MemberJoined, actorDisplayName: "MaraIonescu" }),
        activity({ id: "act-1" }),
      ],
    });

    renderDetail();

    expect(screen.getByText("AlpBalaj renamed the pot")).toBeInTheDocument();
    expect(screen.getByText("Flat")).toBeInTheDocument();
    expect(screen.getByText("MaraIonescu joined")).toBeInTheDocument();
    expect(screen.getByText("AlpBalaj created this pot")).toBeInTheDocument();
  });

  it("leads with the pot's balance and your own position, and they add up", () => {
    mockDetail({
      pot: pot(),
      members: [
        member({ id: "mem-1", displayName: "AlpBalaj", isYou: true }),
        member({ id: "mem-2", displayName: "MaraIonescu" }),
      ],
    });

    renderDetail();

    expect(screen.getByTestId("pot-balance")).toHaveTextContent("€120.00");
    expect(screen.getByTestId("pot-your-position")).toHaveTextContent("+€40.00");
    expect(screen.getByText("still yours in the pot")).toBeInTheDocument();

    // The positions table states the invariant where a member can check it:
    // 40 + 80 is the 120 in the pot.
    expect(screen.getByRole("rowheader", { name: "In the pot" })).toBeInTheDocument();
    expect(
      screen.getByText("Everyone's position adds up to what is in the pot — always, after every change."),
    ).toBeInTheDocument();
  });

  it("says plainly when a member has used more than they put in", () => {
    mockDetail({
      pot: pot({ yourPosition: -15 }),
      members: [member({ isYou: true })],
      ledger: ledger({
        balance: 0,
        isLow: true,
        positions: [
          {
            membershipId: "mem-1",
            displayName: "AlpBalaj",
            isYou: true,
            isActive: true,
            toppedUp: 20,
            outOfPocket: 0,
            shares: 35,
            withdrawn: 0,
            position: -15,
            withdrawable: 0,
          },
        ],
      }),
    });

    renderDetail();

    expect(screen.getByTestId("pot-your-position")).toHaveTextContent("−€15.00");
    expect(screen.getByText("you have used more than you put in")).toBeInTheDocument();

    // Nothing to take out, so the control is disabled rather than absent — a
    // button that comes and goes is a bigger surprise than one that says why.
    expect(screen.getByRole("button", { name: /Take out/ })).toBeDisabled();
    expect(screen.getByText("This pot is running low. Anyone can add to it.")).toBeInTheDocument();
  });

  it("shows an expense with its shares, and offers removal only where the server allows it", () => {
    mockDetail({
      pot: pot(),
      members: [member({ isYou: true })],
      ledger: ledger({
        entries: [
          {
            id: "exp-1",
            kind: 1,
            date: "2026-08-14",
            createdAt: "2026-08-14T10:00:00Z",
            amount: 60,
            title: "The big shop",
            description: null,
            actorDisplayName: "AlpBalaj",
            actorMembershipId: "mem-1",
            paidByDisplayName: null,
            paidByMembershipId: null,
            shares: [
              { membershipId: "mem-1", displayName: "AlpBalaj", isYou: true, amount: 30 },
              { membershipId: "mem-2", displayName: "MaraIonescu", isYou: false, amount: 30 },
            ],
            canDelete: true,
          },
          {
            id: "exp-2",
            kind: 1,
            date: "2026-08-13",
            createdAt: "2026-08-13T10:00:00Z",
            amount: 20,
            title: "Mara paid at the till",
            description: null,
            actorDisplayName: "MaraIonescu",
            actorMembershipId: "mem-2",
            paidByDisplayName: "MaraIonescu",
            paidByMembershipId: "mem-2",
            shares: [{ membershipId: "mem-1", displayName: "AlpBalaj", isYou: true, amount: 20 }],
            // Reversing it would credit Mara's account, and nobody writes into
            // an account they do not own. W3 is where cross-user writes arrive.
            canDelete: false,
          },
        ],
      }),
    });

    renderDetail();

    expect(screen.getByText("The big shop")).toBeInTheDocument();
    expect(screen.getByText("out of pocket")).toBeInTheDocument();

    // Who a bill was for is the fact somebody is most likely to want to check,
    // so it is on the row rather than behind a tap. The name and the amount are
    // separate elements, hence the textContent match.
    expect(
      screen
        .getAllByRole("listitem")
        .some((li) => li.textContent?.replace(/\s+/g, " ").includes("You €30.00")),
    ).toBe(true);

    expect(screen.getByRole("button", { name: "Remove The big shop" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Mara paid at the till" }),
    ).not.toBeInTheDocument();
  });

  it("shows no settlement anywhere — that is W3's, and it arrives with the cross-user write", () => {
    mockDetail({
      pot: pot(),
      members: [member({ isYou: true })],
      activity: [activity({})],
    });

    const { container } = renderDetail();

    // W1 asserted this about money. Money arrived, so the boundary moves to the
    // next wave's vocabulary rather than disappearing: a boundary nobody
    // asserts is a boundary that moves on its own.
    const text = container.textContent ?? "";
    for (const word of ["Settle", "owes you", "you owe", "Confirm payment", "Inbox"]) {
      expect(text).not.toContain(word);
    }
  });

  it("says the same thing for a pot that is gone as for one that was never yours", () => {
    mockDetail({ pot: null, isError: true });

    renderDetail();

    // The screen cannot tell the two apart, because the API deliberately does
    // not tell it — a non-member gets 404, never 403.
    expect(screen.getByText("This pot is not available")).toBeInTheDocument();
    expect(
      screen.getByText("Either it does not exist, or you are not a member of it."),
    ).toBeInTheDocument();
  });
});
