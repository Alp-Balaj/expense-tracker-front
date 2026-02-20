import { useEffect, useState } from "react"
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
import { useAuth } from "@/Authorization/AuthContext"
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi"
import type { Income } from "@/Models/Income"
import type { Category } from "@/Models/Category"
import type { AxiosError } from "axios"

export default function IncomePage() {
  const { accessToken, isAuthReady } = useAuth()
  const { getAllData } = useAuthorizationApi()

  const [incomes, setIncomes] = useState<Income[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // const fetchIncomes = useCallback(async () => {
  //   try {
  //     const data = await getAllData<Income[]>("api/Income")
  //     setIncomes(data)
  //   } catch (e: unknown) {
  //     const err = e as AxiosError
  //     if (err.response?.status !== 401) console.error(err)
  //   }
  // }, [getAllData])

  // const fetchCategories = useCallback(async () => {
  //   try {
  //     const data = await getAllData<Category[]>("api/Category")
  //     setCategories(data)
  //   } catch (e: unknown) {
  //     const err = e as AxiosError
  //     if (err.response?.status !== 401) console.error(err)
  //   }
  // }, [getAllData])

  useEffect(() => {
    if (!isAuthReady || !accessToken) return

    let cancelled = false

    ;(async () => {
      try {
        const [incomeData, categoryData] = await Promise.all([
          getAllData<Income[]>("api/Income"),
          getAllData<Category[]>("api/Category"),
        ])
        if (!cancelled) {
          setIncomes(incomeData)
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
        title="Income"
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
      />

      <main className="p-6 space-y-6">
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
