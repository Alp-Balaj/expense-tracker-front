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

vi.mock("@/Components/General/PageHeader", () => ({ PageHeader: () => null }))
vi.mock("@/Components/Saving/SavingsHeroCard", () => ({ SavingsHeroCard: () => null }))
vi.mock("@/Components/Saving/SavingsAchievementCard", () => ({ SavingsAchievementCard: () => null }))
vi.mock("@/Components/Saving/SavingsGoalFormModal", () => ({ default: () => null }))
vi.mock("@/Components/Saving/SavingsGoalGrid", () => ({
  SavingsGoalGrid: ({
    onAddContribution,
  }: {
    onAddContribution: (goalId: string, contribution: SavingContributions) => void
  }) => (
    <button
      onClick={() =>
        onAddContribution("goal-1", { amount: 50, date: "2026-07-26" } as SavingContributions)
      }
    >
      add-contribution
    </button>
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
      contribution: { amount: 50, date: "2026-07-26" },
    })
    expect(toast.success).toHaveBeenCalledWith("Contribution added")
    expect(toast.error).not.toHaveBeenCalled()
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
