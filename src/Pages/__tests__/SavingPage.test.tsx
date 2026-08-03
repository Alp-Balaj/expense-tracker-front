import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import SavingPage from "@/Pages/SavingPage"
import * as savingHooks from "@/Hooks/queries/useSavingGoals"
import type { SavingContributions } from "@/Models/SavingGoals"

// Locks in Fix-3 ("Savings page updates state only in catch blocks"): the
// contribution handler must toast success only when the mutation actually
// resolves, and toast an error (never silently swallow it) when it rejects.

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock("@/Hooks/queries/useSavingGoals")

vi.mock("@/Components/Saving/SavingsHeroCard", () => ({ SavingsHeroCard: () => null }))
vi.mock("@/Components/Saving/SavingsAchievementCard", () => ({ SavingsAchievementCard: () => null }))
vi.mock("@/Components/Saving/SavingsGoalFormModal", () => ({ default: () => null }))
// The grid stands in for the goal card's contribution modal: it hands up the
// same shape the modal submits, account included. The handler rethrows so the
// modal can keep the dialog open, so the stand-in swallows that rejection the
// way the real modal's await does.
vi.mock("@/Components/Saving/SavingsGoalGrid", () => ({
  SavingsGoalGrid: ({
    onAddContribution,
  }: {
    onAddContribution: (
      goalId: string,
      contribution: SavingContributions
    ) => void | Promise<void>
  }) => (
    <>
      <button
        onClick={() =>
          void Promise.resolve(
            onAddContribution("goal-1", {
              amount: 50,
              date: "2026-07-26",
              accountId: "acc-1",
            } as SavingContributions)
          ).catch(() => {})
        }
      >
        add-contribution
      </button>
      <button
        onClick={() =>
          void Promise.resolve(
            onAddContribution("goal-1", {
              amount: -20,
              date: "2026-07-26",
              accountId: "acc-1",
            } as SavingContributions)
          ).catch(() => {})
        }
      >
        release-contribution
      </button>
    </>
  ),
}))

const mockedHooks = vi.mocked(savingHooks)

describe("SavingPage contribution handler", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHooks.useSavingGoalsQuery.mockReturnValue({ data: [] } as never)
    mockedHooks.useCreateSavingGoal.mockReturnValue({ mutateAsync: vi.fn() } as never)
    mockedHooks.useUpdateSavingGoal.mockReturnValue({ mutateAsync: vi.fn() } as never)
    mockedHooks.useDeleteSavingGoal.mockReturnValue({ mutateAsync: vi.fn() } as never)
  })

  it("shows a success toast once the contribution mutation resolves", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    mockedHooks.useAddSavingContribution.mockReturnValue({ mutateAsync } as never)

    render(<SavingPage />)
    await userEvent.click(screen.getByText("add-contribution"))

    expect(mutateAsync).toHaveBeenCalledWith({
      goalId: "goal-1",
      contribution: { amount: 50, date: "2026-07-26", accountId: "acc-1" },
    })
    expect(toast.success).toHaveBeenCalledWith("Contribution added")
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("names a negative contribution a release in the success toast", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    mockedHooks.useAddSavingContribution.mockReturnValue({ mutateAsync } as never)

    render(<SavingPage />)
    await userEvent.click(screen.getByText("release-contribution"))

    expect(mutateAsync).toHaveBeenCalledWith({
      goalId: "goal-1",
      contribution: { amount: -20, date: "2026-07-26", accountId: "acc-1" },
    })
    expect(toast.success).toHaveBeenCalledWith("Money released")
  })

  it("shows an error toast (not a silent failure) when the mutation rejects", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error("network down"))
    mockedHooks.useAddSavingContribution.mockReturnValue({ mutateAsync } as never)

    render(<SavingPage />)
    await userEvent.click(screen.getByText("add-contribution"))

    expect(toast.error).toHaveBeenCalledWith("network down")
    expect(toast.success).not.toHaveBeenCalled()
  })
})
