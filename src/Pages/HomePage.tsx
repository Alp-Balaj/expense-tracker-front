//#region Imports
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/Components/ui/sidebar";
import { AppSidebar } from "@/Components/Layout/AppSidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import ExpenseList from "@/Components/Lists/ExpenseList";
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  Wallet,
  PiggyBank,
} from "lucide-react";
import { ExpenseCharts } from "@/Components/Charts/ExpenseCharts";
import { SummaryCards } from "@/Components/Dashboard/SummaryCards";

//#endregion

const summaryCards = [
  {
    title: "Total Expenses",
    value: "$2,847.50",
    change: "+12.5%",
    changeType: "negative" as const,
    icon: Receipt,
  },
  {
    title: "Total Income",
    value: "$5,240.00",
    change: "+8.2%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
  {
    title: "Net Balance",
    value: "$2,392.50",
    change: "+4.1%",
    changeType: "positive" as const,
    icon: Wallet,
  },
  {
    title: "Savings Goal",
    value: "68%",
    change: "$680 / $1,000",
    changeType: "neutral" as const,
    icon: PiggyBank,
  },
];

export default function HomePageTEST() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
          <SidebarTrigger className="text-foreground" />
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* Summary Cards */}
          <SummaryCards cards={summaryCards}/>
          
          {/* Expense Chart */}
          <ExpenseCharts />

          {/* Expenses Table Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Expenses</CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage and track your spending across all accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseList />
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}