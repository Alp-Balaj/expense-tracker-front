import { useState } from "react";
import { format } from "date-fns";
import {
  Download,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

import { Button } from "@/Components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { cn } from "@/lib/utils";
import type { TransactionReportResult } from "@/Models/Report";
import { TransactionKind } from "@/Enums/enums";
import { useCurrency } from "@/Hooks/useCurrency";

interface TransactionReportViewerProps {
  report: TransactionReportResult | null;
  isLoading?: boolean;
}

type SortField = "date" | "amount" | "category" | "account" | "kind";
type SortDirection = "asc" | "desc";

const csvCell = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`;

export function TransactionReportViewer({
  report,
  isLoading = false,
}: TransactionReportViewerProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const { convert, format: formatCurrency, formatOriginal, userCurrencyCode } =
    useCurrency();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  const sortedRows = report?.rows
    ? [...report.rows].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "date":
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case "amount":
            comparison =
              convert(a.amount, a.currency) - convert(b.amount, b.currency);
            break;
          case "category":
            comparison = a.category.localeCompare(b.category);
            break;
          case "account":
            comparison = a.account.localeCompare(b.account);
            break;
          case "kind":
            comparison = a.kind - b.kind;
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      })
    : [];

  // Totals are converted into the user's preferred currency so that rows in
  // different currencies aren't added together raw.
  const totalExpenses = report?.rows
    .filter((row) => row.kind === TransactionKind.Expense)
    .reduce((sum, row) => sum + convert(row.amount, row.currency), 0) ?? 0;

  const totalIncomes = report?.rows
    .filter((row) => row.kind === TransactionKind.Income)
    .reduce((sum, row) => sum + convert(row.amount, row.currency), 0) ?? 0;

  const netAmount = totalIncomes - totalExpenses;

  const downloadCSV = () => {
    if (!report?.rows.length) return;

    const headers = ["Date", "Type", "Category", "Account", "Amount", "Currency"];
    const csvContent = [
      headers.join(","),
      ...sortedRows.map((row) =>
        [
          format(new Date(row.date), "yyyy-MM-dd"),
          row.kind === TransactionKind.Expense ? "Expense" : "Income",
          csvCell(row.category),
          csvCell(row.account),
          row.kind === TransactionKind.Expense ? -row.amount : row.amount,
          row.currency,
        ].join(",")
      ),
      "",
      `Total Expenses,,,,${(-totalExpenses).toFixed(2)},${userCurrencyCode}`,
      `Total Incomes,,,,${totalIncomes.toFixed(2)},${userCurrencyCode}`,
      `Net Amount,,,,${netAmount.toFixed(2)},${userCurrencyCode}`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transaction-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const downloadJSON = () => {
    if (!report) return;

    const exportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalExpenses: Number(totalExpenses.toFixed(2)),
        totalIncomes: Number(totalIncomes.toFixed(2)),
        netAmount: Number(netAmount.toFixed(2)),
        currency: userCurrencyCode,
        transactionCount: report.rows.length,
      },
      transactions: sortedRows,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transaction-report-${format(new Date(), "yyyy-MM-dd")}.json`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-card">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Generating report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
        <div className="text-center">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            Configure filters and generate a report to view data
          </p>
        </div>
      </div>
    );
  }

  if (report.rows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-card">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            No transactions found for the selected filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(totalExpenses, userCurrencyCode)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Incomes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {formatCurrency(totalIncomes, userCurrencyCode)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Amount
            </CardTitle>
            {netAmount >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-bold",
                netAmount >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {formatCurrency(netAmount, userCurrencyCode)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Header with Download */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Transaction Details
          </h3>
          <p className="text-sm text-muted-foreground">
            {report.rows.length} transaction{report.rows.length !== 1 ? "s" : ""}{" "}
            found
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={downloadCSV}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadJSON}>
              <FileText className="mr-2 h-4 w-4" />
              Download as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 font-medium"
                  onClick={() => handleSort("date")}
                >
                  Date
                  {sortIcon("date")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 font-medium"
                  onClick={() => handleSort("kind")}
                >
                  Type
                  {sortIcon("kind")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 font-medium"
                  onClick={() => handleSort("category")}
                >
                  Category
                  {sortIcon("category")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 font-medium"
                  onClick={() => handleSort("account")}
                >
                  Account
                  {sortIcon("account")}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 font-medium"
                  onClick={() => handleSort("amount")}
                >
                  Amount
                  {sortIcon("amount")}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {format(new Date(row.date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <Badge variant={row.kind === TransactionKind.Expense? "destructive" : "success"}>
                    {row.kind === TransactionKind.Expense ? "Expense" : "Income"}
                  </Badge>
                </TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.account}</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    row.kind === TransactionKind.Expense ? "text-destructive" : "text-success"
                  )}
                >
                  {formatOriginal(row.amount, row.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
