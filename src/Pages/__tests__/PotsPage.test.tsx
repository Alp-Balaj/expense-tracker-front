import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import PotsPage from "@/Pages/PotsPage";
import PotDetailPage from "@/Pages/PotDetailPage";
import * as potHooks from "@/Hooks/queries/usePots";
import { PotActivityKind, type Pot, type PotActivity, type PotMember } from "@/Models/Pot";

// W1's frontend contract, from the reader's side: a pot has people in it and a
// history, and it has no money in it. The last of those is the one worth a test
// — "no balance yet" is a wave boundary, and a boundary nobody asserts is a
// boundary that moves.

vi.mock("@/Hooks/queries/usePots");

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
  isError?: boolean;
}) {
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

  it("lists a pot by its people and its currency, and never by a balance", () => {
    vi.mocked(potHooks).usePotsQuery.mockReturnValue({
      data: [pot(), pot({ id: "pot-2", name: "Ski trip", memberCount: 1, lowBalanceThreshold: 0 })],
      isLoading: false,
    } as never);
    vi.mocked(potHooks).useCreatePot.mockReturnValue({ mutateAsync: vi.fn() } as never);

    render(
      <MemoryRouter>
        <PotsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("The Flat")).toBeInTheDocument();
    expect(screen.getByText(/2 members · EUR · warns below €50/)).toBeInTheDocument();

    // A threshold of zero is the alert switched off, not a €0 warning line.
    expect(screen.getByText("1 member · EUR")).toBeInTheDocument();
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

    expect(screen.getByText("AlpBalaj")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();

    // Somebody who left stays visible: the activity log goes on naming them,
    // so hiding them here would leave the history full of ghosts.
    expect(screen.getByText("MaraIonescu")).toBeInTheDocument();
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

  it("shows no money anywhere — that is W2's, and it arrives with its invariant", () => {
    mockDetail({
      pot: pot(),
      members: [member({ isYou: true })],
      activity: [activity({})],
    });

    const { container } = renderDetail();

    const text = container.textContent ?? "";
    for (const word of ["Balance", "Position", "Top up", "Withdraw", "Settle"]) {
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
