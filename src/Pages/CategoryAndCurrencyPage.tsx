//#region Imports
import { CategoryCard } from "@/Components/Category/CategoryCard";
import { SidebarInset, SidebarTrigger } from "@/Components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { CategoryType } from "@/Enums/enums";
import {
  LayoutDashboard,
} from "lucide-react";

//#endregion

export default function CategoryAndCurrencyPage() {
  return (
    <SidebarInset className="bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <SidebarTrigger className="text-foreground" />
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Categories & Currencies</h1>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <Tabs defaultValue="expenses" className="w-[60%]">
            <TabsList>
                <TabsTrigger value="expenses">Expense</TabsTrigger>
                <TabsTrigger value="incomes">Income</TabsTrigger>
                <TabsTrigger value="savings">Saving</TabsTrigger>
                <TabsTrigger value="futureExpenses">Future Expenses</TabsTrigger>
            </TabsList>
            {/* CurrencyContainer for TabsContent TODO */}
            <TabsContent value="expenses">
                <div className="flex w-screen">
                    <CategoryCard
                        name="Cigarettes"
                        description="Cigarette expenses"
                        type= {CategoryType.Expense}
                        color="expense"
                    />
                    <CategoryCard
                        name=""
                        description=""
                        type= {CategoryType.Expense}
                        color="expense"
                    />
                    <CategoryCard
                        name=""
                        description=""
                        type= {CategoryType.Expense}
                        color="expense"
                    />
                    <CategoryCard
                        name=""
                        description=""
                        type= {CategoryType.Expense}
                        color="expense"
                    />
                </div>
            </TabsContent>
            <TabsContent value="incomes">
                <CategoryCard
                    name=""
                    description=""
                    type= {CategoryType.Income}
                    color="income"
                />
            </TabsContent>
            <TabsContent value="savings">
                <CategoryCard
                    name=""
                    description=""
                    type= {CategoryType.Savings}
                    color="saving"
                />
            </TabsContent>
            <TabsContent value="futureExpenses">
                <CategoryCard
                    name=""
                    description=""
                    type= {CategoryType.FutureExpense}
                    color="futureExpense"
                />
            </TabsContent>
        </Tabs>
        <div className="w-[30%]">
            {/* CurrencyCard TODO */}
        </div>
      </main>
    </SidebarInset>
  );
}