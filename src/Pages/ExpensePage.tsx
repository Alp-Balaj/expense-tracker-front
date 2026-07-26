import { TrendingDown } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card"
import { PageHeader } from "@/Components/General/PageHeader"
import { ExpenseSummaryCards } from "@/Components/Expense/ExpenseSummaryCards"
import { ExpenseCharts } from "@/Components/Dashboard/ExpenseCharts"
import ExpenseList from "@/Components/Lists/ExpenseList"
import { useExpensesQuery } from "@/Hooks/queries/useExpenses"
import { useCategoriesQuery } from "@/Hooks/queries/useCategories"

export default function ExpensePage() {
  const { data: expenses = [] } = useExpensesQuery()
  const { data: categories = [] } = useCategoriesQuery()

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Expenses"
        icon={<TrendingDown className="h-5 w-5 text-primary" />}
      />

      <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Summary Cards */}
        <ExpenseSummaryCards expenses={expenses} />

        {/* Charts */}
        <ExpenseCharts expenses={expenses} categories={categories} />

        {/* Expense Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Expense History</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage and track your spending across all accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseList />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}