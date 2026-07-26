import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/Components/General/DataTable"

// Locks in Fix-18 ("Wire DataTable search to the global filter"): typing in
// the search box must actually filter the rendered rows, not just sit there
// disconnected from a dead Filter button.

type Row = { id: string; title: string; amount: number; date: string }

const columns: ColumnDef<Row>[] = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "title", header: "Title" },
  { accessorKey: "amount", header: "Amount" },
]

const data: Row[] = [
  { id: "1", title: "Groceries", amount: 50, date: "2026-07-01" },
  { id: "2", title: "Rent", amount: 1200, date: "2026-07-02" },
]

describe("DataTable global search", () => {
  it("filters rows down to the ones matching the search box", async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={data} globalSearchKeys={["title"]} />)

    expect(screen.getByText("Groceries")).toBeInTheDocument()
    expect(screen.getByText("Rent")).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText("Search..."), "Rent")

    await waitFor(() => expect(screen.queryByText("Groceries")).not.toBeInTheDocument())
    expect(screen.getByText("Rent")).toBeInTheDocument()
  })

  it("shows the empty state when nothing matches", async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={data} globalSearchKeys={["title"]} />)

    await user.type(screen.getByPlaceholderText("Search..."), "nonexistent")

    await waitFor(() => expect(screen.getByText("No results.")).toBeInTheDocument())
  })
})
