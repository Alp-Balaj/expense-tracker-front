"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/Components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import ExpenseListTEST from "@/Components/Lists/ExpenseList-Temp";
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  Wallet,
  Tags,
  PiggyBank,
  Settings,
  HelpCircle,
  DollarSign,
} from "lucide-react";
import { Button } from "@/Components/ui/button";

const menuItems = [
  { icon: Receipt, label: "Expenses", isActive: true },
  { icon: TrendingUp, label: "Income", isActive: false },
  { icon: Wallet, label: "Accounts", isActive: false },
  { icon: Tags, label: "Categories", isActive: false },
  { icon: PiggyBank, label: "Savings", isActive: false },
];

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
      <Sidebar className="border-sidebar-border">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <DollarSign className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-sidebar-foreground">FinanceTrack</h2>
              <p className="text-xs text-muted-foreground">Expense Manager</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-4">
              Finance
            </SidebarGroupLabel>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={item.isActive}
                    className="gap-3 px-4"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">John Doe</p>
                <p className="text-xs text-muted-foreground">Free Plan</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">Help</span>
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.title} className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{card.value}</div>
                  <p
                    className={`text-xs ${
                      card.changeType === "positive"
                        ? "text-primary"
                        : card.changeType === "negative"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {card.change}
                    {card.changeType !== "neutral" && " from last month"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Expenses Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Expenses</CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage and track your spending across all accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseListTEST />
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
