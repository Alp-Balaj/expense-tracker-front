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
} from "@/Components/ui/sidebar";

//import AccountList from "../Components/Lists/AccountList";
//import CategoryList from "../Components/Lists/CategoryList";
//import CurrencyList from "../Components/Lists/CurrencyList";
// import ExpenseList from "../Components/Lists/ExpenseList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import ExpenseListTEST from "@/Components/Lists/ExpenseList-Temp";
//import FutureExpenseList from "../Components/Lists/FutureExpenseList";
//import IncomeList from "../Components/Lists/IncomeList";
//import SavingList from "../Components/Lists/SavingList";

const HomePage = () => {
  return (
    <SidebarProvider>
      {/* Sidebar */}
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Finance</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Expenses</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Income</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Accounts</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Categories</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Savings</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Main content */}
      <SidebarInset>
        {/* Optional header */}
        <div className="flex items-center gap-2 p-4 border-b mb-5">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>

        {/* Page body */}
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
      </SidebarInset>
    </SidebarProvider>
  );
};

export default HomePage;
