import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { CategoryCard } from "@/Components/Category/CategoryCard";
import { CategoryChart } from "@/Components/Category/CategoryChart";
import { CurrencyCard } from "@/Components/Currency/CurrencyCard";
import { CurrencyComparisonTable } from "@/Components/Currency/CurrencyComparisonTable";

import { CategoryForm } from "@/Components/Forms/CategoryForm";
import { CurrencyForm } from "@/Components/Forms/CurrencyForm";

import type { Category } from "@/Models/Category";
import { CategoryType } from "@/Enums/enums";
import {
  Plus,
  Wallet,
  TrendingUp,
  PiggyBank,
  Calendar,
  Coins,
} from "lucide-react";
import type { Currency } from "@/Models/Currency";
import { SidebarInset, SidebarTrigger } from "@/Components/ui/sidebar";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import type { AxiosError } from "axios";
import { useAuth } from "@/Authorization/AuthContext";

// Sample data
const initialCategories: Category[] = [
  { id: "1", name: "Groceries", description: "Food and household items", categoryType: CategoryType.Expense, color: "#ef4444", totalAmount: 450 },
  { id: "2", name: "Utilities", description: "Electricity, water, internet", categoryType: CategoryType.Expense, color: "#f97316", totalAmount: 180 },
  { id: "3", name: "Transport", description: "Fuel and public transport", categoryType: CategoryType.Expense, color: "#eab308", totalAmount: 120 },
  { id: "4", name: "Entertainment", description: "Movies, games, subscriptions", categoryType: CategoryType.Expense, color: "#8b5cf6", totalAmount: 85 },
  { id: "5", name: "Salary", description: "Monthly salary", categoryType: CategoryType.Income, color: "#22c55e", totalAmount: 3500 },
  { id: "6", name: "Freelance", description: "Side projects and consulting", categoryType: CategoryType.Income, color: "#14b8a6", totalAmount: 800 },
  { id: "7", name: "Investments", description: "Dividends and returns", categoryType: CategoryType.Income, color: "#3b82f6", totalAmount: 250 },
  { id: "8", name: "Emergency Fund", description: "For unexpected expenses", categoryType: CategoryType.Savings, color: "#3b82f6", totalAmount: 5000 },
  { id: "9", name: "Vacation", description: "Holiday savings", categoryType: CategoryType.Savings, color: "#14b8a6", totalAmount: 1200 },
  { id: "10", name: "Retirement", description: "Long-term savings", categoryType: CategoryType.Savings, color: "#6b7280", totalAmount: 15000 },
  { id: "11", name: "New Laptop", description: "Planned purchase", categoryType: CategoryType.FutureExpense, color: "#ec4899", totalAmount: 1500 },
  { id: "12", name: "Home Renovation", description: "Kitchen remodel", categoryType: CategoryType.FutureExpense, color: "#f97316", totalAmount: 8000 },
];

const initialCurrencies: Currency[] = [
  { id: "1", code: "EUR", symbol: "€", name: "Euro", exchangeRateToBase: 1 },
  { id: "2", code: "USD", symbol: "$", name: "US Dollar", exchangeRateToBase: 1.0856 },
  { id: "3", code: "GBP", symbol: "£", name: "British Pound", exchangeRateToBase: 0.8521 },
  { id: "4", code: "JPY", symbol: "¥", name: "Japanese Yen", exchangeRateToBase: 162.45 },
  { id: "5", code: "CHF", symbol: "Fr", name: "Swiss Franc", exchangeRateToBase: 0.9432 },
];

const tabConfig = [
  { value: "expenses", label: "Expenses", icon: Wallet, categoryType: CategoryType.Expense },
  { value: "income", label: "Income", icon: TrendingUp, categoryType: CategoryType.Income },
  { value: "savings", label: "Savings", icon: PiggyBank, categoryType: CategoryType.Savings },
  { value: "future", label: "Future Expenses", icon: Calendar, categoryType: CategoryType.FutureExpense },
];

export default function CategoryAndCurrencyPage() {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData, postData, putData } = useAuthorizationApi();


  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryLoadError, setCategoryLoadError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setCategoryLoadError(null);

    try {
      const data = await getAllData<Category[]>("api/Category");
      setCategories(data);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        console.error(err);
        setCategoryLoadError("Failed to load categories.");
      }
    } finally {
      setIsLoadingCategories(false);
    }
  }, [getAllData]);

  useEffect(() => {
    if (!isAuthReady || !accessToken) return;
    fetchCategories();
  }, [fetchCategories, isAuthReady, accessToken]);

  const [currencies, setCurrencies] = useState<Currency[]>(initialCurrencies);
  const [activeTab, setActiveTab] = useState("expenses");

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  const currentTabConfig = tabConfig.find((t) => t.value === activeTab);
  const currentType = currentTabConfig?.categoryType || CategoryType.Expense;

  // Filter categories by type
  // const filteredCategories = categories.filter((c) => c.categoryType === currentType);

  // Category handlers
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategories((prev) => prev.filter((c) => c.id !== category.id));
  };

  const handleSaveCategory = (category: Category) => {
    setCategories((prev) => {
      const exists = prev.find((c) => c.id === category.id);
      if (exists) {
        return prev.map((c) => (c.id === category.id ? category : c));
      }
      return [...prev, category];
    });
    setEditingCategory(null);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  };

  // Currency handlers
  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setCurrencyDialogOpen(true);
  };

  const handleDeleteCurrency = (currency: Currency) => {
    setCurrencies((prev) => prev.filter((c) => c.id !== currency.id));
  };

  const handleSaveCurrency = (currency: Currency) => {
    setCurrencies((prev) => {
      const exists = prev.find((c) => c.id === currency.id);
      if (exists) {
        return prev.map((c) => (c.id === currency.id ? currency : c));
      }
      return [...prev, currency];
    });
    setEditingCurrency(null);
  };

  const handleAddCurrency = () => {
    setEditingCurrency(null);
    setCurrencyDialogOpen(true);
  };

  return (
    <SidebarInset className="bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
          <SidebarTrigger className="text-foreground" />
          <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Categories & Cyrrencies</h1>
          </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories Section - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>
                      Manage your expense, income, savings, and future expense categories
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    {tabConfig.map((tab) => (
                      <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                        <tab.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {tabConfig.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value} className="mt-6 space-y-6">
                      {/* Chart */}
                      <CategoryChart 
                        categories={categories.filter((c) => c.categoryType === tab.categoryType)}
                        type={tab.categoryType}
                      />

                      {/* Category Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {categories
                          .filter((c) => c.categoryType === tab.categoryType)
                          .map((category) => (
                            <CategoryCard
                              key={category.id}
                              category={category}
                              onEdit={handleEditCategory}
                              onDelete={handleDeleteCategory}
                            />
                          ))}
                      </div>

                      {categories.filter((c) => c.categoryType === tab.categoryType).length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <tab.icon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p>No {tab.label.toLowerCase()} categories yet</p>
                          <Button
                            variant="outline"
                            className="mt-4 bg-transparent"
                            onClick={handleAddCategory}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add your first category
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Currencies Section - 1/3 width */}
          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="h-5 w-5" />
                      Currencies
                    </CardTitle>
                    <CardDescription>
                      Manage currencies and exchange rates
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={handleAddCurrency}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {currencies.map((currency) => (
                  <CurrencyCard
                    key={currency.id}
                    currency={currency}
                    onEdit={handleEditCurrency}
                    onDelete={handleDeleteCurrency}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Currency Comparison Table */}
            <CurrencyComparisonTable currencies={currencies} baseAmount={100} />
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <CategoryForm
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
        onSave={handleSaveCategory}
        defaultType={currentType}
      />

      <CurrencyForm
        open={currencyDialogOpen}
        onOpenChange={setCurrencyDialogOpen}
        currency={editingCurrency}
        onSave={handleSaveCurrency}
      />
    </SidebarInset>
  );
}
