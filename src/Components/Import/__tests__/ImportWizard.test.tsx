import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ImportWizard } from "@/Components/Import/ImportWizard";
import * as accountHooks from "@/Hooks/queries/useAccounts";
import * as categoryHooks from "@/Hooks/queries/useCategories";
import * as importServices from "@/Services/importServices";
import { CategoryType } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { Category } from "@/Models/Category";
import type { ImportPreview, ImportResult } from "@/Models/Import";

// Suggestion-6's flow, from the browser's side.
//
// The property under test throughout is that nothing is written until the user
// has seen what would be written: the commit button does not exist before the
// mapping is complete, and the preview it is shown comes from the server rather
// than from a second parser in the browser that could disagree with it.

vi.mock("@/Hooks/queries/useAccounts");
vi.mock("@/Hooks/queries/useCategories");
vi.mock("@/Services/importServices");

const accounts: Account[] = [
  {
    id: "acc-1",
    name: "Main Checking",
    amountType: 0,
    balance: 1000,
    currencyId: "eur",
    currencyCode: "EUR",
    description: "",
  },
];

const categories: Category[] = [
  { id: "cat-e", name: "Uncategorized", categoryType: CategoryType.Expense, color: "", description: "" } as Category,
  { id: "cat-i", name: "Other income", categoryType: CategoryType.Income, color: "", description: "" } as Category,
];

const inspected: ImportPreview = {
  columns: ["Buchungstag", "Verwendungszweck", "Betrag"],
  delimiter: ";",
  suggested: {
    dateColumn: 0,
    descriptionColumn: 1,
    amountColumn: 2,
    counterpartyColumn: null,
  },
  rows: [],
  totalRows: 3,
  readyCount: 0,
  duplicateCount: 0,
  problemCount: 0,
  truncated: false,
};

const mapped: ImportPreview = {
  ...inspected,
  rows: [
    {
      rowNumber: 2,
      date: "2026-08-01",
      amount: 42.5,
      isExpense: true,
      title: "REWE MARKT, BERLIN",
      description: null,
      categoryId: "cat-e",
      categoryName: "Uncategorized",
      categoryFromRule: false,
      isDuplicate: false,
      problem: null,
      canImport: true,
      raw: [],
    },
    {
      rowNumber: 3,
      date: "2026-08-02",
      amount: 2500,
      isExpense: false,
      title: "GEHALT AUGUST",
      description: null,
      categoryId: "cat-i",
      categoryName: "Other income",
      categoryFromRule: false,
      isDuplicate: true,
      problem: null,
      canImport: false,
      raw: [],
    },
    {
      rowNumber: 4,
      date: null,
      amount: 0,
      isExpense: true,
      title: "BAD ROW",
      description: null,
      categoryId: "",
      categoryName: "",
      categoryFromRule: false,
      isDuplicate: false,
      problem: "Could not read the date \"nope\".",
      canImport: false,
      raw: [],
    },
  ],
  readyCount: 1,
  duplicateCount: 1,
  problemCount: 1,
};

const committed: ImportResult = {
  imported: 1,
  duplicatesSkipped: 1,
  failed: 1,
  expenseTotal: 42.5,
  incomeTotal: 0,
  problems: [{ rowNumber: 4, reason: "Could not read the date \"nope\".", raw: [] }],
};

function renderWizard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ImportWizard />
    </QueryClientProvider>
  );
}

const csvFile = () =>
  new File(["Buchungstag;Verwendungszweck;Betrag\n"], "statement.csv", { type: "text/csv" });

async function uploadAndMap(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(screen.getByLabelText(/drop a csv statement/i), csvFile());
  await screen.findByText("statement.csv");

  // The account and the two default categories are the only things the
  // suggestion cannot guess.
  await user.click(screen.getByLabelText(/import into/i));
  await user.click(await screen.findByRole("option", { name: "Main Checking" }));

  await user.click(screen.getByLabelText(/default expense category/i));
  await user.click(await screen.findByRole("option", { name: "Uncategorized" }));

  await user.click(screen.getByLabelText(/default income category/i));
  await user.click(await screen.findByRole("option", { name: "Other income" }));
}

describe("ImportWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.spyOn(accountHooks, "useAccountsQuery").mockReturnValue({
      data: accounts,
      isError: false,
    } as ReturnType<typeof accountHooks.useAccountsQuery>);

    vi.spyOn(categoryHooks, "useCategoriesQuery").mockReturnValue({
      data: categories,
      isError: false,
    } as ReturnType<typeof categoryHooks.useCategoriesQuery>);

    vi.mocked(importServices.previewImportApi).mockImplementation(
      async (_file, mapping) => (mapping ? mapped : inspected)
    );
    vi.mocked(importServices.commitImportApi).mockResolvedValue(committed);
  });

  it("asks for a file before anything else", () => {
    renderWizard();

    expect(screen.getByText(/drop a csv statement/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^import/i })).not.toBeInTheDocument();
  });

  it("inspects an uploaded file without a mapping, and adopts the server's suggestion", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.upload(screen.getByLabelText(/drop a csv statement/i), csvFile());

    await screen.findByText("statement.csv");
    // First call carries no mapping: the file is looked at before it is mapped.
    expect(vi.mocked(importServices.previewImportApi).mock.calls[0][1]).toBeNull();
    expect(screen.getByText(/3 columns · 3 rows/)).toBeInTheDocument();
  });

  it("will not offer to import until the mapping is complete", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.upload(screen.getByLabelText(/drop a csv statement/i), csvFile());
    await screen.findByText("statement.csv");

    expect(
      screen.getByText(/choose an account, the date, amount and description columns/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^import \d/i })).not.toBeInTheDocument();
  });

  it("shows what each row would become, and marks the ones that will not import", async () => {
    const user = userEvent.setup();
    renderWizard();

    await uploadAndMap(user);

    expect(await screen.findByText("REWE MARKT, BERLIN")).toBeInTheDocument();
    expect(screen.getByText("1 will import")).toBeInTheDocument();
    expect(screen.getByText("1 already there")).toBeInTheDocument();
    expect(screen.getByText("1 unreadable")).toBeInTheDocument();

    // A duplicate is expected and fine; a problem row is one that gets left
    // behind, and says why.
    expect(screen.getByText(/already imported/i)).toBeInTheDocument();
    expect(screen.getByText(/could not read the date/i)).toBeInTheDocument();
  });

  it("only offers to import the rows that can be imported", async () => {
    const user = userEvent.setup();
    renderWizard();
    await uploadAndMap(user);

    // Not "import 3 rows" — the button's own label is the promise.
    expect(await screen.findByRole("button", { name: /import 1 row$/i })).toBeInTheDocument();
  });

  it("reports what the commit actually did, including what it left behind", async () => {
    const user = userEvent.setup();
    renderWizard();
    await uploadAndMap(user);

    await user.click(await screen.findByRole("button", { name: /import 1 row$/i }));

    expect(
      await screen.findByText(/1 imported, 1 already there, 1 skipped/i)
    ).toBeInTheDocument();
    // Nothing disappears silently.
    expect(screen.getByText(/line 4: could not read the date/i)).toBeInTheDocument();
  });

  it("saves the mapping as a named format for next month", async () => {
    const user = userEvent.setup();
    renderWizard();
    await uploadAndMap(user);

    await user.type(screen.getByLabelText(/remember this format as/i), "Sparkasse");
    await user.click(screen.getByRole("button", { name: /save format/i }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("expensetracker.importProfiles") ?? "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe("Sparkasse");
      expect(stored[0].mapping.accountId).toBe("acc-1");
    });
  });

  it("cannot save a format without a name", async () => {
    const user = userEvent.setup();
    renderWizard();
    await uploadAndMap(user);

    expect(screen.getByRole("button", { name: /save format/i })).toBeDisabled();
  });
});
