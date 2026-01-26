import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";

import { CategoryCard } from "@/Components/Category/CategoryCard";
import { CategoryChart } from "@/Components/Category/CategoryChart";
import { CategoryForm } from "@/Components/Category/CategoryForm";
import type { AddCategory, Category } from "@/Models/Category";

import { CurrencyForm } from "@/Components/Currency/CurrencyForm";
import { CurrencyCard } from "@/Components/Currency/CurrencyCard";
import { CurrencyComparisonTable } from "@/Components/Currency/CurrencyComparisonTable";
import type { Currency } from "@/Models/Currency";

import { CategoryType } from "@/Enums/enums";
import {
  Plus,
  Wallet,
  TrendingUp,
  PiggyBank,
  Calendar,
  Coins,
  Tags,
} from "lucide-react";

import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import type { AxiosError } from "axios";
import { useAuth } from "@/Authorization/AuthContext";
import { PageHeader } from "@/Components/General/PageHeader";

const tabConfig = [
  { value: "expenses", label: "Expenses", icon: Wallet, categoryType: CategoryType.Expense },
  { value: "income", label: "Income", icon: TrendingUp, categoryType: CategoryType.Income },
  { value: "savings", label: "Savings", icon: PiggyBank, categoryType: CategoryType.Savings },
  { value: "future", label: "Future Expenses", icon: Calendar, categoryType: CategoryType.FutureExpense },
];

export default function CategoryAndCurrencyPage() {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData, postData, putData } = useAuthorizationApi();

  //#region Category
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
        setCategoryLoadError("Failed to load categories.");
        console.error(categoryLoadError);
      }
    } finally {
      setIsLoadingCategories(false);
    }
  }, [getAllData]);

  
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategories((prev) => prev.filter((c) => c.id !== category.id));
  };

  const handleSaveCategory = useCallback(async (category: AddCategory) => {
    setIsLoadingCategories(true);
    if(category.id === null){
      try {
        await postData<Category>("api/Category", category);
      }  catch (e: unknown) {
        const err = e as AxiosError;
        if (err.response?.status !== 401) {
          console.error(err);
          setCategoryLoadError("Failed to add category.");
        }
      } finally {
        setIsLoadingCategories(false);
      }
      fetchCategories();
    } else {
      try {
        await putData<Category>("api/Category", category);
      }  catch (e: unknown) {
        const err = e as AxiosError;
        if (err.response?.status !== 401) {
          console.error(err);
          setCategoryLoadError("Failed to edit category.");
        }
      } finally {
        setIsLoadingCategories(false);
      }
      fetchCategories();
    }
    setEditingCategory(null);
  },[postData, putData, fetchCategories]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  };

  //#endregion

  //#region Currency
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [currencyLoadError, setCurrencyLoadError] = useState<string | null>(null);


  const fetchCurrencies = useCallback(async () => {
    setIsLoadingCategories(true);
    setCategoryLoadError(null);

    try {
      const data = await getAllData<Currency[]>("api/Currency");
      setCurrencies(data);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        setCurrencyLoadError("Failed to load currencies.");
        console.error(currencyLoadError);
      }
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [getAllData]);

  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  const handleSaveCurrency = useCallback(async (currency: Currency) => {
    setIsLoadingCurrencies(true);
    if(currency.id === null){
      try {
        await postData<Currency>("api/Currency", currency);
      }  catch (e: unknown) {
        const err = e as AxiosError;
        if (err.response?.status !== 401) {
          console.error(err);
          setCategoryLoadError("Failed to add currency.");
        }
      } finally {
        setIsLoadingCategories(false);
      }
      fetchCurrencies();
    } else {
      try {
        await putData<Currency>("api/Currency", currency);
      }  catch (e: unknown) {
        const err = e as AxiosError;
        if (err.response?.status !== 401) {
          console.error(err);
          setCategoryLoadError("Failed to edit currency.");
        }
      } finally {
        setIsLoadingCategories(false);
      }
      fetchCurrencies();
    }
    setEditingCurrency(null);
  },[postData, putData]);
  
  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setCurrencyDialogOpen(true);
  };

  const handleDeleteCurrency = (currency: Currency) => {
    setCurrencies((prev) => prev.filter((c) => c.id !== currency.id));
  };

  const handleAddCurrency = () => {
    setEditingCurrency(null);
    setCurrencyDialogOpen(true);
  };
  
  //#endregion
  
  useEffect(() => {
    if (!isAuthReady || !accessToken) return;
    if(!isLoadingCategories)
      fetchCategories();
    if(!isLoadingCurrencies)
      fetchCurrencies();
  }, [fetchCategories, fetchCurrencies, isAuthReady, accessToken]);
  
  const [activeTab, setActiveTab] = useState("expenses");
  const currentTabConfig = tabConfig.find((t) => t.value === activeTab);
  const currentType = currentTabConfig?.categoryType || CategoryType.Expense;

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <PageHeader title="Categories And Currencies" icon={<Tags className="h-5 w-5 text-primary" />} />

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
    </div>
  );
}
