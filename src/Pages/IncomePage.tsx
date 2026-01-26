import { useState, useMemo } from "react";
import {
  TrendingUp,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  Briefcase,
  Building2,
  Gift,
  PiggyBank,
  Banknote,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  type ChartConfig,
} from "@/Components/ui/chart";
import type { IncomeWithDetails } from "@/Models/Income";
import { PageHeader } from "@/Components/General/PageHeader";
import { IncomeSummaryCards } from "@/Components/Income/IncomeSummaryCards";
import { IncomeChartsSection } from "@/Components/Income/IncomeChartsSection";
import { IncomeByAccountCard } from "@/Components/Income/IncomeByAccountCard";
import type { Category } from "@/Models/Category";
import IncomeList from "@/Components/Lists/IncomeList";

// Sample categories for income sources
const incomeCategories: Category[] = [];

// Sample accounts
const accounts = [
  { id: "acc-1", name: "Main Checking", type: "checking" },
  { id: "acc-2", name: "Savings Account", type: "savings" },
  { id: "acc-3", name: "Cash", type: "cash" },
];

// Sample income data
const sampleIncomes: IncomeWithDetails[] = [];

// Monthly trend data for the chart
const monthlyTrendData = [
  { month: "Aug", income: 4800 },
  { month: "Sep", income: 5100 },
  { month: "Oct", income: 4500 },
  { month: "Nov", income: 5100 },
  { month: "Dec", income: 6400 },
  { month: "Jan", income: 6250 },
];

const lineChartConfig: ChartConfig = {
  income: {
    label: "Income",
    color: "oklch(0.65 0.15 145)",
  },
};

const getCategoryIcon = (categoryName: string) => {
  switch (categoryName.toLowerCase()) {
    case "salary":
      return Briefcase;
    case "freelance":
      return Building2;
    case "investments":
      return TrendingUp;
    case "gifts":
      return Gift;
    case "rental":
      return PiggyBank;
    default:
      return Banknote;
  }
};

export default function IncomePage() {
  const [incomes, setIncomes] = useState<IncomeWithDetails[]>(sampleIncomes);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthIncomes = incomes.filter((inc) => {
      const date = new Date(inc.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    const lastMonthIncomes = incomes.filter((inc) => {
      const date = new Date(inc.date);
      return (
        date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      );
    });

    const currentMonthTotal = currentMonthIncomes.reduce(
      (sum, inc) => sum + inc.amount,
      0
    );
    const lastMonthTotal = lastMonthIncomes.reduce(
      (sum, inc) => sum + inc.amount,
      0
    );
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const avgMonthlyIncome = totalIncome / 6;

    const percentChange =
      lastMonthTotal > 0
        ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0;

    // Income by source
    const bySource = incomeCategories.map((cat) => {
      const total = incomes
        .filter((inc) => inc.categoryId === cat.id)
        .reduce((sum, inc) => sum + inc.amount, 0);
      return {
        name: cat.name,
        value: total,
        color: cat.color,
        percentage: totalIncome > 0 ? (total / totalIncome) * 100 : 0,
      };
    }).filter((item) => item.value > 0);

    // Income by account
    const byAccount = accounts.map((acc) => {
      const total = incomes
        .filter((inc) => inc.accountId === acc.id)
        .reduce((sum, inc) => sum + inc.amount, 0);
      return {
        name: acc.name,
        value: total,
        percentage: totalIncome > 0 ? (total / totalIncome) * 100 : 0,
      };
    }).filter((item) => item.value > 0);

    // Top income source
    const topSource = bySource.reduce(
      (max, item) => (item.value > max.value ? item : max),
      { name: "N/A", value: 0, color: "", percentage: 0 }
    );

    return {
      currentMonthTotal,
      lastMonthTotal,
      totalIncome,
      avgMonthlyIncome,
      percentChange,
      bySource,
      byAccount,
      topSource,
      transactionCount: currentMonthIncomes.length,
    };
  }, [incomes]);

  // Filter and sort incomes
  const filteredIncomes = useMemo(() => {
    let filtered = [...incomes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inc) =>
          inc.title.toLowerCase().includes(query) ||
          inc.description?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((inc) => inc.categoryId === categoryFilter);
    }

    if (accountFilter !== "all") {
      filtered = filtered.filter((inc) => inc.accountId === accountFilter);
    }

    filtered.sort((a, b) => {
      const aValue = sortField === "date" ? new Date(a.date).getTime() : a.amount;
      const bValue = sortField === "date" ? new Date(b.date).getTime() : b.amount;
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [incomes, searchQuery, categoryFilter, accountFilter, sortField, sortDirection]);

  const toggleSort = (field: "date" | "amount") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const pieChartConfig: ChartConfig = stats.bySource.reduce((acc, item) => {
    acc[item.name] = {
      label: item.name,
      color: item.color,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader title="Income" icon={<TrendingUp className="h-5 w-5 text-primary" />} />
      
      <main className="p-6 space-y-6 min-h-screen">
        {/* Income info summaries */}
        <IncomeSummaryCards
          stats={stats}
          formatCurrency={formatCurrency}
          lastMonthLabel="December 2025 total"
          averageWindowLabel="Over the last 6 months"
        />

        {/* Income chart section */}
        <IncomeChartsSection
          monthlyTrendData={monthlyTrendData}
          bySource={stats.bySource}
          formatCurrency={formatCurrency}
          lineChartConfig={lineChartConfig}
          pieChartConfig={pieChartConfig}
        />

        {/* Income by account cards */}
        <IncomeByAccountCard
          byAccount={stats.byAccount}
          formatCurrency={formatCurrency}
        />

        {/* Recent Incomes Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Recent Income</CardTitle>
            <CardDescription>
              Manage and track your income transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search income..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-primary/5 border-primary/20 focus:border-primary"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {incomeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </div>

            {/* Table */}
            <IncomeList/>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
