import { useState } from "react";
import { format } from "date-fns";
import {
  Download,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
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

interface TransactionReportViewerProps {
  report: TransactionReportResult | null;
  isLoading?: boolean;
  currencySymbol?: string;
}

type SortField = "date" | "amount" | "category" | "account" | "type";
type SortDirection = "asc" | "desc";

export function TransactionReportViewer({
  report,
  isLoading = false,
  currencySymbol = "$",
}: TransactionReportViewerProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedRows = report?.rows
    ? [...report.rows].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "date":
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case "amount":
            comparison = a.amount - b.amount;
            break;
          case "category":
            comparison = a.categoryName.localeCompare(b.categoryName);
            break;
          case "account":
            comparison = a.accountName.localeCompare(b.accountName);
            break;
          case "type":
            comparison = a.type.localeCompare(b.type);
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      })
    : [];

  const totalExpenses = report?.rows
    .filter((row) => row.type === "expense")
    .reduce((sum, row) => sum + row.amount, 0) ?? 0;

  const totalIncomes = report?.rows
    .filter((row) => row.type === "income")
    .reduce((sum, row) => sum + row.amount, 0) ?? 0;

  const netAmount = totalIncomes - totalExpenses;

  const downloadCSV = () => {
    if (!report?.rows.length) return;

    const headers = ["Date", "Description", "Type", "Category", "Account", "Amount"];
    const csvContent = [
      headers.join(","),
      ...sortedRows.map((row) =>
        [
          format(new Date(row.date), "yyyy-MM-dd"),
          `"${row.description.replace(/"/g, '""')}"`,
          row.type,
          `"${row.categoryName}"`,
          `"${row.accountName}"`,
          row.type === "expense" ? -row.amount : row.amount,
        ].join(",")
      ),
      "",
      `Total Expenses,,,,,${-totalExpenses}`,
      `Total Incomes,,,,,${totalIncomes}`,
      `Net Amount,,,,,${netAmount}`,
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
        totalExpenses,
        totalIncomes,
        netAmount,
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {currencySymbol}
              {totalExpenses.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Incomes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {currencySymbol}
              {totalIncomes.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
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
              {netAmount < 0 ? "-" : ""}
              {currencySymbol}
              {Math.abs(netAmount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
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
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 font-medium"
                  onClick={() => handleSort("type")}
                >
                  Type
                  <ArrowUpDown className="h-3 w-3" />
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
                  <ArrowUpDown className="h-3 w-3" />
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
                  <ArrowUpDown className="h-3 w-3" />
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
                  <ArrowUpDown className="h-3 w-3" />
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
                <TableCell className="max-w-[200px] truncate">
                  {row.description}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={row.type === "expense" ? "destructive" : "default"}
                    className={cn(
                      row.type === "income" &&
                        "bg-success text-success-foreground hover:bg-success/90"
                    )}
                  >
                    {row.type === "expense" ? "Expense" : "Income"}
                  </Badge>
                </TableCell>
                <TableCell>{row.categoryName}</TableCell>
                <TableCell>{row.accountName}</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    row.type === "expense" ? "text-destructive" : "text-success"
                  )}
                >
                  {row.type === "expense" ? "-" : "+"}
                  {currencySymbol}
                  {row.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
