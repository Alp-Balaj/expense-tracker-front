import { TrendingUp } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card"
import { PageHeader } from "@/Components/General/PageHeader"
import { IncomeSummaryCards } from "@/Components/Income/IncomeSummaryCards"
import { IncomeCharts } from "@/Components/Income/IncomeCharts"
import IncomeList from "@/Components/Lists/IncomeList"
import { useIncomesQuery } from "@/Hooks/queries/useIncomes"
import { useCategoriesQuery } from "@/Hooks/queries/useCategories"

export default function IncomePage() {
  const { data: incomes = [] } = useIncomesQuery()
  const { data: categories = [] } = useCategoriesQuery()

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Income"
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
      />

      <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Summary Cards */}
        <IncomeSummaryCards incomes={incomes} />

        {/* Charts */}
        <IncomeCharts incomes={incomes} categories={categories} />

        {/* Income Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Income History</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage and track all your income across accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeList />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
