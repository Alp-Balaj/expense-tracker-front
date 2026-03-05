import { useEffect, useState } from "react"
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
import { useAuth } from "@/Authorization/AuthContext"
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi"
import type { Expense } from "@/Models/Expense"
import type { Category } from "@/Models/Category"
import type { AxiosError } from "axios"

export default function ExpensePage() {
  const { accessToken, isAuthReady } = useAuth()
  const { getAllData } = useAuthorizationApi()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    if (!isAuthReady || !accessToken) return

    let cancelled = false

    ;(async () => {
      try {
        const [expenseData, categoryData] = await Promise.all([
          getAllData<Expense[]>("api/Expense"),
          getAllData<Category[]>("api/Category"),
        ])
        if (!cancelled) {
          setExpenses(expenseData)
          setCategories(categoryData)
        }
      } catch (e: unknown) {
        const err = e as AxiosError
        if (err.response?.status !== 401) console.error(err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAuthReady, accessToken, getAllData])

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Expenses"
        icon={<TrendingDown className="h-5 w-5 text-primary" />}
      />

      <main className="p-6 space-y-6">
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