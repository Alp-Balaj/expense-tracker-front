import React from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
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
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

export type SimpleOption = { id: string; name: string };

export type IncomeRow = {
  id: string;
  title: string;
  amount: number;
  date: string | Date;
  description?: string | null;
  accountName: string;

  categoryId?: string;
  categoryName: string;
  categoryColor: string; // hex or css color
};

export type SortKey = "amount" | "date";
export type SortDir = "asc" | "desc";
export type SortState = { key: SortKey; dir: SortDir };

type RecentIncomeCardProps = {
  // data
  filteredIncomes: IncomeRow[];
  incomeCategories: SimpleOption[];
  accounts: SimpleOption[];

  // ui state (controlled)
  searchQuery: string;
  setSearchQuery: (v: string) => void;

  categoryFilter: string; // "all" or category id
  setCategoryFilter: (v: string) => void;

  accountFilter: string; // "all" or account id
  setAccountFilter: (v: string) => void;

  // actions
  onAddIncome?: () => void;
  onEditIncome?: (income: IncomeRow) => void;
  onDeleteIncome?: (income: IncomeRow) => void;

  // formatting / helpers
  formatCurrency: (value: number) => string;
  formatDate: (value: string | Date) => string;
  getCategoryIcon: (categoryName: string) => React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;

  // sorting
  sort?: SortState; // optional: used only for arrow UI
  toggleSort: (key: SortKey) => void;

  // optional text / styling
  title?: string;
  description?: string;
  className?: string;
};

export function RecentIncomeCard({
  filteredIncomes,
  incomeCategories,
  accounts,

  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  accountFilter,
  setAccountFilter,

  onAddIncome,
  onEditIncome,
  onDeleteIncome,

  formatCurrency,
  formatDate,
  getCategoryIcon,

  sort,
  toggleSort,

  title = "Recent Income",
  description = "Manage and track your income transactions",
  className = "",
}: RecentIncomeCardProps) {
  const arrowClass = (key: SortKey) => {
    if (!sort || sort.key !== key) return "opacity-60";
    // rotate for desc
    return sort.dir === "desc" ? "rotate-180" : "";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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

          <Button
            onClick={onAddIncome}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Title</TableHead>

                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort("amount")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Amount
                    <ArrowUpDown
                      className={`ml-1 h-3 w-3 transition-transform ${arrowClass("amount")}`}
                    />
                  </Button>
                </TableHead>

                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort("date")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Date
                    <ArrowUpDown
                      className={`ml-1 h-3 w-3 transition-transform ${arrowClass("date")}`}
                    />
                  </Button>
                </TableHead>

                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">Account</TableHead>
                <TableHead className="font-semibold">Source</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredIncomes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No income records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncomes.map((income) => {
                  const CategoryIcon = getCategoryIcon(income.categoryName);

                  return (
                    <TableRow key={income.id}>
                      <TableCell className="font-medium text-foreground">
                        {income.title}
                      </TableCell>

                      <TableCell className="text-success font-semibold">
                        +{formatCurrency(income.amount)}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {formatDate(income.date)}
                      </TableCell>

                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {income.description ?? ""}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {income.accountName}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 w-6 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: `color-mix(in oklch, ${income.categoryColor} 20%, transparent)`,
                            }}
                          >
                            <CategoryIcon
                              className="h-3 w-3"
                              style={{ color: income.categoryColor }}
                            />
                          </div>
                          <span className="text-muted-foreground">
                            {income.categoryName}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditIncome?.(income)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDeleteIncome?.(income)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}