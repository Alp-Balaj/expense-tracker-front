import { useState } from "react";
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

import type { AxiosError } from "axios";
import { PageHeader } from "@/Components/General/PageHeader";
import ConfirmDelete from "@/Components/General/ConfirmDelete";
import {
  useCategoriesQuery,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/Hooks/queries/useCategories";
import {
  useCurrenciesQuery,
  useCreateCurrency,
  useUpdateCurrency,
  useDeleteCurrency,
} from "@/Hooks/queries/useCurrencies";

const tabConfig = [
  { value: "expenses", label: "Expenses", icon: Wallet, categoryType: CategoryType.Expense },
  { value: "income", label: "Income", icon: TrendingUp, categoryType: CategoryType.Income },
  { value: "savings", label: "Savings", icon: PiggyBank, categoryType: CategoryType.Savings },
  { value: "future", label: "Future Expenses", icon: Calendar, categoryType: CategoryType.FutureExpense },
];

// 400/409/500 on delete generally means the row is still referenced by
// existing transactions (FK constraint) — surface that instead of a
// generic failure message.
function deleteFailureMessage(e: unknown, resource: string): string {
  const err = e as AxiosError;
  if (err.response && [400, 409, 500].includes(err.response.status)) {
    return `This ${resource} is used by existing transactions and can't be deleted.`;
  }
  return `Failed to delete ${resource}.`;
}

export default function CategoryAndCurrencyPage() {
  //#region Category
  const { data: categories = [] } = useCategoriesQuery();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const [categoryLoadError, setCategoryLoadError] = useState<string | null>(null);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };

  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const handleDeleteCategory = (category: Category) => {
    setDeletingCategory(category);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    setCategoryLoadError(null);
    try {
      await deleteCategoryMutation.mutateAsync(deletingCategory);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        console.error(err);
        setCategoryLoadError(deleteFailureMessage(e, "category"));
      }
    } finally {
      setDeletingCategory(null);
    }
  };

  const handleSaveCategory = async (category: AddCategory) => {
    setCategoryLoadError(null);
    try {
      if (category.id === null) await createCategory.mutateAsync(category);
      else await updateCategory.mutateAsync(category);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        console.error(err);
        setCategoryLoadError(category.id === null ? "Failed to add category." : "Failed to edit category.");
      }
    }
    setEditingCategory(null);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  };

  //#endregion

  //#region Currency
  const { data: currencies = [] } = useCurrenciesQuery();
  const createCurrency = useCreateCurrency();
  const updateCurrency = useUpdateCurrency();
  const deleteCurrencyMutation = useDeleteCurrency();
  const [currencyLoadError, setCurrencyLoadError] = useState<string | null>(null);

  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  const handleSaveCurrency = async (currency: Currency) => {
    setCurrencyLoadError(null);
    try {
      if (currency.id === null) await createCurrency.mutateAsync(currency);
      else await updateCurrency.mutateAsync(currency);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        console.error(err);
        setCurrencyLoadError(currency.id === null ? "Failed to add currency." : "Failed to edit currency.");
      }
    }
    setEditingCurrency(null);
  };

  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setCurrencyDialogOpen(true);
  };

  const [deletingCurrency, setDeletingCurrency] = useState<Currency | null>(null);

  const handleDeleteCurrency = (currency: Currency) => {
    setDeletingCurrency(currency);
  };

  const confirmDeleteCurrency = async () => {
    if (!deletingCurrency) return;
    setCurrencyLoadError(null);
    try {
      await deleteCurrencyMutation.mutateAsync(deletingCurrency);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        console.error(err);
        setCurrencyLoadError(deleteFailureMessage(e, "currency"));
      }
    } finally {
      setDeletingCurrency(null);
    }
  };

  const handleAddCurrency = () => {
    setEditingCurrency(null);
    setCurrencyDialogOpen(true);
  };

  //#endregion

  const [activeTab, setActiveTab] = useState("expenses");
  const currentTabConfig = tabConfig.find((t) => t.value === activeTab);
  const currentType = currentTabConfig?.categoryType || CategoryType.Expense;

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <PageHeader title="Categories And Currencies" icon={<Tags className="h-5 w-5 text-primary" />} />

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
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
                {categoryLoadError && (
                  <div role="alert" className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {categoryLoadError}
                  </div>
                )}
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
                {currencyLoadError && (
                  <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {currencyLoadError}
                  </div>
                )}
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

      <ConfirmDelete
        open={deletingCategory !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeletingCategory(null);
        }}
        close={() => setDeletingCategory(null)}
        onConfirm={confirmDeleteCategory}
        title="Delete category?"
        description={`Delete "${deletingCategory?.name}"? This action cannot be undone.`}
      />

      <ConfirmDelete
        open={deletingCurrency !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeletingCurrency(null);
        }}
        close={() => setDeletingCurrency(null)}
        onConfirm={confirmDeleteCurrency}
        title="Delete currency?"
        description={`Delete "${deletingCurrency?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
