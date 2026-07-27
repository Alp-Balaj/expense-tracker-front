import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import AppLayout from "@/Components/Layout/AppLayout";
import { SidebarProvider } from "@/Components/ui/sidebar";
import * as expenseHooks from "@/Hooks/queries/useExpenses";
import * as incomeHooks from "@/Hooks/queries/useIncomes";
import * as futureExpenseHooks from "@/Hooks/queries/useFutureExpenses";
import * as budgetHooks from "@/Hooks/queries/useBudgets";
import * as savingGoalHooks from "@/Hooks/queries/useSavingGoals";
import * as transferHooks from "@/Hooks/queries/useTransfers";
import type { BudgetStatus } from "@/Models/Budget";

vi.mock("@/Hooks/queries/useExpenses");
vi.mock("@/Hooks/queries/useIncomes");
vi.mock("@/Hooks/queries/useFutureExpenses");
vi.mock("@/Hooks/queries/useBudgets");
vi.mock("@/Hooks/queries/useSavingGoals");
vi.mock("@/Hooks/queries/useTransfers");

vi.mock("@/Hooks/useCurrency", () => ({
  useCurrency: () => ({
    userCurrencyCode: "EUR",
    currenciesMap: {},
    convert: (a: number) => a,
    format: (a: number) => `€${a.toFixed(2)}`,
    formatOriginal: (a: number) => `€${a.toFixed(2)}`,
  }),
}));
vi.mock("@/Authorization/AuthContext", () => ({ useAuth: () => ({ username: "Alp Balaj" }) }));
vi.mock("@/Hooks/useAuthenticationApi", () => ({
  useAuthenticationApi: () => ({ logout: vi.fn() }),
}));
vi.mock("@/Components/UserPreferences/UserSettingsModal", () => ({
  UserSettingsModal: () => null,
}));
vi.mock("@/Components/General/ModeToggle", () => ({ ModeToggle: () => null }));
vi.mock("@/Components/Forms/ExpenseForm", () => ({ default: () => null }));
vi.mock("@/Components/Income/IncomeFormModal", () => ({ default: () => null }));
vi.mock("@/Components/Saving/SavingsGoalFormModal", () => ({ default: () => null }));
vi.mock("@/Components/Transfer/TransferFormModal", () => ({ default: () => null }));

const overall: BudgetStatus = {
  id: "b-overall",
  categoryId: null,
  categoryName: "All categories",
  categoryColor: null,
  note: null,
  period: 0,
  month: "2026-07",
  limit: 2200,
  spent: 1847.32,
  remaining: 352.68,
  percentUsed: 83.97,
  baseCurrency: "EUR",
  subtotals: [],
  hasMissingRates: false,
};

function renderShell() {
  vi.mocked(expenseHooks).useExpensesQuery.mockReturnValue({
    data: [{ id: "e1" }, { id: "e2" }],
    isLoading: false,
  } as never);
  vi.mocked(incomeHooks).useIncomesQuery.mockReturnValue({ data: [], isLoading: false } as never);
  vi.mocked(futureExpenseHooks).useFutureExpensesQuery.mockReturnValue({
    data: [],
    isLoading: false,
  } as never);
  vi.mocked(budgetHooks).useBudgetStatusQuery.mockReturnValue({
    data: [overall],
    isLoading: false,
  } as never);
  vi.mocked(expenseHooks).useCreateExpense.mockReturnValue({ mutateAsync: vi.fn() } as never);
  vi.mocked(incomeHooks).useCreateIncome.mockReturnValue({ mutateAsync: vi.fn() } as never);
  vi.mocked(savingGoalHooks).useCreateSavingGoal.mockReturnValue({
    mutateAsync: vi.fn(),
  } as never);
  vi.mocked(transferHooks).useCreateTransfer.mockReturnValue({ mutateAsync: vi.fn() } as never);

  return render(
    <MemoryRouter initialEntries={["/budgets"]}>
      <SidebarProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/budgets" element={<div>page body</div>} />
          </Route>
        </Routes>
      </SidebarProvider>
    </MemoryRouter>,
  );
}

describe("app shell", () => {
  // jsdom has no matchMedia; useIsMobile needs one to decide on the rail.
  beforeAll(() => {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  it("renders the rail, the top bar and the tab bar around the page", () => {
    renderShell();

    expect(screen.getByText("Finance Tracker")).toBeInTheDocument();
    // The cents are a separate dimmed span, so read the block as a whole.
    const block = screen.getByText("Safe to spend").parentElement;
    expect(block).toHaveTextContent("€352.68");
    expect(block).toHaveTextContent("84% used");

    // Grouped nav, with the expense count on its row.
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);

    // Top bar titles from the route.
    expect(screen.getAllByRole("heading", { name: "Budgets" }).length).toBe(2);
    expect(screen.getByText(/Search transactions/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Toggle sidebar" })).toBeInTheDocument();

    // Mobile tab bar and the page itself.
    expect(screen.getByRole("button", { name: "Log expense" })).toBeInTheDocument();
    expect(screen.getByText("page body")).toBeInTheDocument();

    expect(screen.getByText("Alp Balaj")).toBeInTheDocument();
    // Once in the rail's footer, once as the phone top bar's avatar.
    expect(screen.getAllByText("AB")).toHaveLength(2);
  });
});
