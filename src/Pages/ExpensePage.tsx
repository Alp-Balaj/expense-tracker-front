import { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card"
import { ExpenseSummaryCards } from "@/Components/Expense/ExpenseSummaryCards"
import { ExpenseCharts } from "@/Components/Dashboard/ExpenseCharts"
import ExpenseList from "@/Components/Lists/ExpenseList"
import { PeriodSelector } from "@/Components/General/PeriodSelector"
import { ListFilterMenu } from "@/Components/General/ListFilterMenu"
import { usePeriod } from "@/Hooks/usePeriod"
import { filterByPeriod, periodLabel } from "@/lib/period"
import { EMPTY_LIST_FILTERS, applyListFilters, type ListFilters } from "@/lib/listFilters"
import { CategoryType } from "@/Enums/enums"
import { useExpensesQuery } from "@/Hooks/queries/useExpenses"
import { useAccountsQuery } from "@/Hooks/queries/useAccounts"
import { useCategoriesQuery } from "@/Hooks/queries/useCategories"

export default function ExpensePage() {
  const { data: expenses = [] } = useExpensesQuery()
  const { data: categories = [] } = useCategoriesQuery()
  const { data: accounts = [] } = useAccountsQuery()
  const { period, setPreset, setCustomRange } = usePeriod("expenses")
  const [filters, setFilters] = useState<ListFilters>(EMPTY_LIST_FILTERS)

  // Category/account/amount filters apply to the whole page, so they are
  // applied to the full history first. The cards and charts window *that* by
  // period themselves — they also need the months either side of the
  // selection, for the trend line and the previous-period comparison.
  const scoped = useMemo(() => applyListFilters(expenses, filters), [expenses, filters])
  const visible = useMemo(() => filterByPeriod(scoped, period), [scoped, period])

  // Only expense categories can appear here; offering an income category would
  // only ever filter everything away.
  const categoryOptions = useMemo(
    () =>
      categories
        .filter((c) => c.categoryType === CategoryType.Expense)
        .map((c) => ({ value: c.id, label: c.name })),
    [categories],
  )
  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: a.name })),
    [accounts],
  )

  return (
    <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Period and filters — these drive the cards, the charts and the table */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <PeriodSelector
          period={period}
          onPresetChange={setPreset}
          onCustomRangeChange={setCustomRange}
        />
        <ListFilterMenu
          value={filters}
          onChange={setFilters}
          categories={categoryOptions}
          accounts={accountOptions}
        />
      </div>

      {/* Summary Cards */}
      <ExpenseSummaryCards expenses={scoped} period={period} />

      {/* Charts */}
      <ExpenseCharts expenses={scoped} categories={categories} period={period} />

      {/* Expense Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Expense History</CardTitle>
          <CardDescription className="text-muted-foreground">
            {periodLabel(period)} — {visible.length}{" "}
            {visible.length === 1 ? "entry" : "entries"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseList data={visible} />
        </CardContent>
      </Card>
    </main>
  )
}
