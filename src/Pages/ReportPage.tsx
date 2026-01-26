import { useCallback, useEffect, useState } from "react";
import {
  FileBarChart,
  FileText,
  PieChart,
  TrendingUp,
  Construction,
  LayoutDashboard,
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
import type { Category } from "@/Models/Category";
import type { AxiosError } from "axios";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import { SidebarTrigger } from "@/Components/ui/sidebar";

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

    const response = await postData<TransactionReportResult>('/api/Reports/transactions/preview', filters);
    const data = await response;

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
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <SidebarTrigger className="text-foreground" />
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Reports</h1>
        </div>
      </header>
      <main className="p-6 space-y-8">
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
                  currencySymbol="€"
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
      </main>
    </div>
  );
}
