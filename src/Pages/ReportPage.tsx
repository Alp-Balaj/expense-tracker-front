import { useCallback, useEffect, useState } from "react";
import {
  FileBarChart,
  FileText,
  PieChart,
  TrendingUp,
  Construction,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { TransactionReportFilters } from "@/Components/Report/TransactionReportFilters";
import { TransactionReportViewer } from "@/Components/Report/TransactionReportViewer";
import type {
  TransactionReportRequest,
  TransactionReportResult,
  ReportType,
} from "@/Models/Report";
import type { Account } from "@/Models/Account";
// import { AmountType, CategoryType } from "@/Enums/enums";
import type { Category } from "@/Models/Category";
import type { AxiosError } from "axios";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";

// Generate sample report data
// function generateSampleReport(
//   filters: TransactionReportRequest
// ): TransactionReportResult {
//   const { accessToken, isAuthReady } = useAuth();
//   const { getAllData } = useAuthorizationApi();

//   //#region Accounts
//   const [accounts, setAccounts] = useState<Account[]>([]);
//   const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
//   const [accountLoadError, setAccountLoadError] = useState<string | null>(null);

//   const fetchAccounts = useCallback(async () => {
//     setIsLoadingAccounts(true);
//     setAccountLoadError(null);
//     try {
//       const data = await getAllData<Account[]>("api/Account");
//       setAccounts(data);
//     } catch (e: unknown) {
//       const err = e as AxiosError;
//       if (err.response?.status !== 401) {
//         setAccountLoadError("Failed to load accounts.");
//         console.error(accountLoadError);
//       }
//     } finally {
//       setIsLoadingAccounts(false);
//     }
//   }, [getAllData]);

//   //#endregion
//   //#region Categories
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [isLoadingCategories, setIsLoadingCategories] = useState(false);
//   const [categoryLoadError, setCategoryLoadError] = useState<string | null>(null);

//   const fetchCategories = useCallback(async () => {
//     setIsLoadingCategories(true);
//     setCategoryLoadError(null);
//     try {
//       const data = await getAllData<Category[]>("api/Category");
//       setCategories(data);
//     } catch (e: unknown) {
//       const err = e as AxiosError;
//       if (err.response?.status !== 401) {
//         setCategoryLoadError("Failed to load categories.");
//         console.error(categoryLoadError);
//       }
//     } finally {
//       setIsLoadingCategories(false);
//     }
//   }, [getAllData]);
//   //#endregion
  
//   useEffect(() => {
//     if (!isAuthReady || !accessToken) return;
//     if(!isLoadingCategories)
//       fetchCategories();
//     if(!isLoadingAccounts)
//       fetchAccounts();
//   }, [fetchCategories, fetchAccounts, isAuthReady, accessToken]);

//   const fromDate = new Date(filters.from);
//   const toDate = new Date(filters.to);
//   const daysDiff = Math.ceil(
//     (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
//   );

//   const rows = [];
//   const transactionCount = Math.min(Math.max(daysDiff * 2, 10), 50);

//   for (let i = 0; i < transactionCount; i++) {
//     const randomDays = Math.floor(Math.random() * daysDiff);
//     const date = new Date(fromDate);
//     date.setDate(date.getDate() + randomDays);

//     const isExpense =
//       (filters.includeExpenses && filters.includeIncomes && Math.random() > 0.3) ||
//       (filters.includeExpenses && !filters.includeIncomes);

//     if (!isExpense && !filters.includeIncomes) continue;
//     if (isExpense && !filters.includeExpenses) continue;

//     const type = isExpense ? CategoryType.Expense : CategoryType.Income;
//     const relevantCategories = categories.filter((c) => c.categoryType === type);
//     const category =
//       relevantCategories[Math.floor(Math.random() * relevantCategories.length)];
//     const account =
//       accounts[Math.floor(Math.random() * accounts.length)];

//     // Filter by selected accounts and categories
//     if (filters.accountIds?.length && !filters.accountIds.includes(account.id))
//       continue;
//     if (
//       filters.categoryIds?.length &&
//       !filters.categoryIds.includes(category.id)
//     )
//       continue;

//     const descriptions: Record<string, string[]> = {
//       Housing: ["Rent payment", "Home insurance", "Property tax", "Repairs"],
//       Food: ["Grocery shopping", "Restaurant", "Coffee shop", "Food delivery"],
//       Transport: ["Gas station", "Uber ride", "Bus fare", "Car maintenance"],
//       Utilities: ["Electric bill", "Water bill", "Internet", "Phone bill"],
//       Entertainment: ["Netflix", "Movie tickets", "Concert", "Gaming"],
//       Other: ["Miscellaneous", "Gift", "Donation", "Subscription"],
//       Salary: ["Monthly salary", "Bonus", "Overtime pay"],
//       Freelance: ["Project payment", "Consulting fee", "Design work"],
//       Investments: ["Dividend", "Stock sale", "Interest"],
//     };

//     const descList = descriptions[category.name] || ["Transaction"];
//     const description = descList[Math.floor(Math.random() * descList.length)];
//     const amount = isExpense
//       ? Math.floor(Math.random() * 500) + 10
//       : Math.floor(Math.random() * 2000) + 500;

//     rows.push({
//       id: `txn-${i}`,
//       date: date.toISOString(),
//       description,
//       amount,
//       type: CategoryType.Expense | CategoryType.Income,
//       categoryId: category.id,
//       categoryName: category.name,
//       accountId: account.id,
//       accountName: account.name,
//     });
//   }

//   const total = rows.reduce(
//     (sum, row) => sum + (row.type === CategoryType.Expense ? -row.amount : row.amount),
//     0
//   );

//   return { rows, total };
// }

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>("transactions");
  const [report, setReport] = useState<TransactionReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
const { accessToken, isAuthReady } = useAuth();
  const { getAllData, postData } = useAuthorizationApi();

  //#region Accounts
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accountLoadError, setAccountLoadError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    setAccountLoadError(null);
    try {
      const data = await getAllData<Account[]>("api/Account");
      setAccounts(data);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        setAccountLoadError("Failed to load accounts.");
        console.error(accountLoadError);
      }
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [getAllData]);
  //#endregion

  //#region Categories
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
  //#endregion
  
  useEffect(() => {
    if (!isAuthReady || !accessToken) return;
    if(!isLoadingCategories)
      fetchCategories();
    if(!isLoadingAccounts)
      fetchAccounts();
  }, [fetchCategories, fetchAccounts, isAuthReady, accessToken]);


  const handleGenerateReport = async (filters: TransactionReportRequest) => {
    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await postData<TransactionReportResult>('/api/Reports/transactions/preview', JSON.stringify(filters));
    const data = await response;
    // const jsonData = data.json();
    // const data = generateSampleReport(filters);
    setReport(data);
    setIsLoading(false);
  };

  const reportTabs = [
    {
      value: "transactions" as ReportType,
      label: "Transaction Report",
      icon: FileBarChart,
    },
    {
      value: "summary" as ReportType,
      label: "Summary Report",
      icon: FileText,
    },
    {
      value: "budget" as ReportType,
      label: "Budget Report",
      icon: PieChart,
    },
    {
      value: "trends" as ReportType,
      label: "Trends Report",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Reports
          </h1>
          <p className="mt-2 text-muted-foreground">
            Generate and download detailed financial reports
          </p>
        </div>

        {/* Report Type Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ReportType)}
          className="space-y-6"
        >
          <TabsList className="h-auto flex-wrap gap-2 bg-transparent p-0">
            {reportTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 rounded-lg border border-border bg-card px-4 py-2.5 data-[state=active]:border-primary"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Transaction Report Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
              {/* Filters Panel */}
              <div className="lg:sticky lg:top-8 lg:self-start">
                <TransactionReportFilters
                  accounts={accounts}
                  categories={categories}
                  onGenerateReport={handleGenerateReport}
                  isLoading={isLoading}
                />
              </div>

              {/* Report Viewer */}
              <div>
                <TransactionReportViewer
                  report={report}
                  isLoading={isLoading}
                  currencySymbol="$"
                />
              </div>
            </div>
          </TabsContent>

          {/* Placeholder for other report types */}
          <TabsContent value="summary">
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
              <div className="text-center">
                <Construction className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium text-foreground">
                  Summary Report
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Coming soon - Monthly and yearly summaries
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="budget">
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
              <div className="text-center">
                <Construction className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium text-foreground">
                  Budget Report
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Coming soon - Budget vs actual spending analysis
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
              <div className="text-center">
                <Construction className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium text-foreground">
                  Trends Report
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Coming soon - Spending trends and patterns over time
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
