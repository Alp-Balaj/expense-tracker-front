import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { TransactionReportViewer } from "@/Components/Report/TransactionReportViewer"
import { TransactionKind } from "@/Enums/enums"
import type { TransactionReportResult } from "@/Models/Report"

// Locks in Fix-9 ("Report math is wrong on the front-end"): net must be
// income minus expenses with every row converted into the base currency
// first, never a raw cross-currency sum, and column sort must actually
// reorder the rows (not just flip an icon).

vi.mock("@/Hooks/useCurrency", () => ({
  useCurrency: () => ({
    userCurrencyCode: "EUR",
    // 1 USD = 2 EUR for this fixture, everything else passes through untouched.
    convert: (amount: number, fromCode: string) => (fromCode === "USD" ? amount * 2 : amount),
    format: (amount: number) => amount.toFixed(2),
    formatOriginal: (amount: number) => amount.toFixed(2),
  }),
}))

const report: TransactionReportResult = {
  total: 0,
  rows: [
    { id: "1", date: "2026-07-01", kind: TransactionKind.Expense, category: "Food", account: "Checking", amount: 50, currency: "EUR" },
    { id: "2", date: "2026-07-02", kind: TransactionKind.Income, category: "Salary", account: "Checking", amount: 1500, currency: "EUR" },
    { id: "3", date: "2026-07-03", kind: TransactionKind.Income, category: "Bonus", account: "Checking", amount: 500, currency: "EUR" },
    { id: "4", date: "2026-07-04", kind: TransactionKind.Expense, category: "Travel", account: "Checking", amount: 10, currency: "USD" },
  ],
}

describe("TransactionReportViewer totals", () => {
  it("computes net as income minus expenses, converting each row into the base currency first", () => {
    render(<TransactionReportViewer report={report} />)

    // totalExpenses = 50 EUR + (10 USD * 2) = 70
    // totalIncomes  = 1500 + 500 = 2000
    // net           = 2000 - 70 = 1930
    expect(screen.getByText("70.00")).toBeInTheDocument()
    expect(screen.getByText("2000.00")).toBeInTheDocument()
    expect(screen.getByText("1930.00")).toBeInTheDocument()
  })

  it("sorts rows by date, defaults to newest-first, and reverses on a second click", () => {
    render(<TransactionReportViewer report={report} />)

    const categoryCellsInOrder = () =>
      screen
        .getAllByRole("row")
        .slice(1) // drop the header row
        .map((row) => within(row).getAllByRole("cell")[2].textContent)

    expect(categoryCellsInOrder()).toEqual(["Travel", "Bonus", "Salary", "Food"])

    fireEvent.click(screen.getByRole("button", { name: /date/i }))

    expect(categoryCellsInOrder()).toEqual(["Food", "Salary", "Bonus", "Travel"])
  })
})
