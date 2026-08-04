import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import JoinPotPage from "@/Pages/JoinPotPage";
import * as potHooks from "@/Hooks/queries/usePots";
import type { PotInvitePreview } from "@/Models/Pot";

// The one screen in the app that answers for somebody who is not yet a member.
// What it says, and what it refuses to say, is the whole test.

vi.mock("@/Hooks/queries/usePots");

function preview(overrides: Partial<PotInvitePreview> = {}): PotInvitePreview {
  return {
    potName: "The Flat",
    currencyCode: "EUR",
    invitedByDisplayName: "AlpBalaj",
    isRedeemable: true,
    alreadyAMember: false,
    problem: null,
    ...overrides,
  };
}

function renderJoin(options: { data?: PotInvitePreview; isError?: boolean }) {
  vi.mocked(potHooks).usePotInvitePreviewQuery.mockReturnValue({
    data: options.data,
    isLoading: false,
    isError: options.isError ?? false,
  } as never);
  vi.mocked(potHooks).useJoinPot.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as never);

  return render(
    <MemoryRouter initialEntries={["/join/ABCDEFGHJKLMNPQRSTUVWX"]}>
      <Routes>
        <Route path="/join/:code" element={<JoinPotPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("JoinPotPage", () => {
  it("says who invited you and to what, and nothing else about the pot", () => {
    const { container } = renderJoin({ data: preview() });

    expect(screen.getByText("AlpBalaj invited you to")).toBeInTheDocument();
    expect(screen.getByText("The Flat")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join The Flat" })).toBeInTheDocument();

    // No member list, no history, no count — holding a code buys you the name
    // of the thing you are being asked to join and no more.
    const text = container.textContent ?? "";
    expect(text).not.toContain("members");
    expect(text).not.toContain("Activity");
  });

  it("tells a revoked link apart from an expired one", () => {
    renderJoin({
      data: preview({ isRedeemable: false, problem: "That invite has been revoked." }),
    });

    // "Ask for a new one" and "that was cancelled" are different next actions,
    // so the screen repeats the server's sentence rather than flattening both
    // into "invalid".
    expect(screen.getByText("That invite has been revoked.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Join/ })).not.toBeInTheDocument();
  });

  it("treats a second visit to a spent link as done, not as a failure", () => {
    renderJoin({ data: preview({ alreadyAMember: true }) });

    expect(screen.getByText("You are already in The Flat")).toBeInTheDocument();
    expect(screen.getByText("Nothing to accept — the link has already done its job."))
      .toBeInTheDocument();
  });

  it("does not say whether an unknown code was ever a real pot", () => {
    const { container } = renderJoin({ isError: true });

    expect(screen.getByText("This invite link is not valid")).toBeInTheDocument();
    expect(container.textContent ?? "").not.toContain("The Flat");
  });
});
