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

import AccountList from "../Components/Lists/AccountList";
import CategoryList from "../Components/Lists/CategoryList";
import CurrencyList from "../Components/Lists/CurrencyList";
import ExpenseList from "../Components/Lists/ExpenseList";
import FutureExpenseList from "../Components/Lists/FutureExpenseList";
import IncomeList from "../Components/Lists/IncomeList";
import SavingList from "../Components/Lists/SavingList";

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
        <div className="flex items-center gap-2 p-4 border-b">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>

        {/* Page body */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
          <ExpenseList />
          <IncomeList />
          <AccountList />
          <CategoryList />
          <CurrencyList />
          <FutureExpenseList />
          <SavingList />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default HomePage;