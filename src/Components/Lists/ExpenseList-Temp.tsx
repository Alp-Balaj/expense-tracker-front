'use client';

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Filter, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import type { Expense } from "@/Models/Expense";
import type { AxiosError } from "axios";
import { Input } from "@/Components/ui/input";
// import ExpenseForm from "@/Components/Forms/ExpenseForm";
import ExpenseFormTEST from "../Forms/ExpenseForm-Temp";

export default function ExpenseList() {
  const { accessToken, isAuthReady } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { getAllData, postData, putData, deleteData } = useAuthorizationApi();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await getAllData<Expense[]>("api/Expense");
      setExpenses(data);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        console.error(err);
      }
    }
  }, [getAllData]);

  useEffect(() => {
    if (!isAuthReady || !accessToken) return;
    fetchExpenses();
    return () => {};
  }, [fetchExpenses, isAuthReady, accessToken]);

  const addExpense = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const editExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: Expense) => {
    if (editingExpense != null) {
      await putData("api/Expense", data);
    } else {
      await postData("api/Expense", data);
    }

    setEditingExpense(null);
    setIsFormOpen(false);
    await fetchExpenses();
  };

  const handleDeleteExpense = async (data: Expense) => {
    if (!data) return;
    try {
      await deleteData(`api/Expense`, data);
      await fetchExpenses();
    } catch (e: unknown) {
      const err = e as AxiosError;
      console.error(err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-primary text-primary-foreground placeholder:text-primary-foreground/70 border-none focus-visible:ring-primary/50"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={addExpense}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Expense</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 bg-transparent border-border"
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter expenses</span>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary border-none">
              <TableHead className="text-primary-foreground font-semibold">
                Title
              </TableHead>
              <TableHead className="text-primary-foreground font-semibold text-right">
                Amount
              </TableHead>
              <TableHead className="text-primary-foreground font-semibold hidden sm:table-cell">
                Date
              </TableHead>
              <TableHead className="text-primary-foreground font-semibold hidden md:table-cell">
                Description
              </TableHead>
              <TableHead className="text-primary-foreground font-semibold hidden lg:table-cell">
                Account
              </TableHead>
              <TableHead className="text-primary-foreground font-semibold hidden sm:table-cell">
                Category
              </TableHead>
              <TableHead className="text-primary-foreground font-semibold w-[100px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center h-32 text-muted-foreground bg-card"
                >
                  {searchTerm
                    ? "No expenses found matching your search."
                    : "No expenses yet. Add your first expense to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  className="hover:bg-muted/50 bg-card transition-colors"
                >
                  <TableCell className="font-medium text-card-foreground">
                    {expense.title}
                  </TableCell>
                  <TableCell className="text-right font-mono text-destructive">
                    -{formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {formatDate(expense.date.toString())}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                    {expense.description || "-"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {expense.accountId}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {expense.categoryId}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => editExpense(expense)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit expense</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExpense(expense)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete expense</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredExpenses.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredExpenses.length} expense
            {filteredExpenses.length !== 1 ? "s" : ""}
          </span>
          <span className="font-mono font-medium text-foreground">
            Total:{" "}
            {formatCurrency(
              filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
            )}
          </span>
        </div>
      )}

      {isFormOpen && (
        <ExpenseFormTEST
          key={editingExpense?.id ?? "new"}
          row={editingExpense}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
