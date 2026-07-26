import { useState } from "react";
import {
  FileBarChart,
  FileText,
  PieChart,
  TrendingUp,
  Construction,
  Paperclip,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { TransactionReportFilters } from "@/Components/Report/TransactionReportFilters";
import { TransactionReportViewer } from "@/Components/Report/TransactionReportViewer";
import type {
  TransactionReportRequest,
  TransactionReportResult,
  ReportType,
} from "@/Models/Report";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import { PageHeader } from "@/Components/General/PageHeader";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>("transactions");
  const [report, setReport] = useState<TransactionReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { postData } = useAuthorizationApi();

  const { data: accounts = [], isError: accountsFailed } = useAccountsQuery();
  const { data: categories = [], isError: categoriesFailed } = useCategoriesQuery();
  const accountLoadError = accountsFailed ? "Failed to load accounts." : null;
  const categoryLoadError = categoriesFailed ? "Failed to load categories." : null;

  const handleGenerateReport = async (filters: TransactionReportRequest) => {
    setIsLoading(true);
    try {
      const data = await postData<TransactionReportResult>('/api/Reports/transactions/preview', filters);
      setReport(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to generate report."));
    } finally {
      setIsLoading(false);
    }
  };

  const reportTabs = [
    {
      value: "transactions" as ReportType,
      label: "Transaction Report",
      shortLabel: "Transactions",
      icon: FileBarChart,
    },
    {
      value: "summary" as ReportType,
      label: "Summary Report",
      shortLabel: "Summary",
      icon: FileText,
    },
    {
      value: "budget" as ReportType,
      label: "Budget Report",
      shortLabel: "Budget",
      icon: PieChart,
    },
    {
      value: "trends" as ReportType,
      label: "Trends Report",
      shortLabel: "Trends",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Reports" icon={<Paperclip className="h-5 w-5 text-primary" />} />
      
      <main className="p-3 sm:p-6 space-y-4 sm:space-y-8">
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
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 rounded-lg border border-border bg-card px-3 py-2.5 data-[state=active]:border-primary"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Transaction Report Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {(accountLoadError || categoryLoadError) && (
              <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {accountLoadError ?? categoryLoadError}
              </div>
            )}
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
