import { useMemo, useState } from "react";
import { PieChart, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/Components/General/PageHeader";
import { Button } from "@/Components/ui/button";
import ConfirmDelete from "@/Components/General/ConfirmDelete";
import { Spinner } from "@/Components/ui/spinner";
import { BudgetCard } from "@/Components/Budget/BudgetCard";
import { BudgetSummaryCards } from "@/Components/Budget/BudgetSummaryCards";
import { MonthSelector } from "@/Components/Budget/MonthSelector";
import BudgetFormModal from "@/Components/Budget/BudgetFormModal";

import type { AddBudget, Budget, BudgetStatus } from "@/Models/Budget";
import { currentMonth, formatMonth } from "@/lib/budget";
import { getApiErrorMessage } from "@/lib/errors";
import {
  useBudgetsQuery,
  useBudgetStatusQuery,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from "@/Hooks/queries/useBudgets";

export default function BudgetPage() {
  const [month, setMonth] = useState(currentMonth());

  const { data: budgets = [] } = useBudgetsQuery();
  const {
    data: statuses = [],
    isLoading,
    isError,
  } = useBudgetStatusQuery(month);

  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BudgetStatus | null>(null);

  const budgetsById = useMemo(
    () => new Map(budgets.map((b) => [b.id, b])),
    [budgets]
  );
  const takenCategoryIds = useMemo(
    () => budgets.map((b) => b.categoryId),
    [budgets]
  );

  const handleNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (status: BudgetStatus) => {
    setEditing(budgetsById.get(status.id) ?? null);
    setFormOpen(true);
  };

  const handleSubmit = async (data: AddBudget) => {
    try {
      if (editing) await updateBudget.mutateAsync(data);
      else await createBudget.mutateAsync(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to save budget."));
      throw e; // the modal keeps the dialog open so the user can retry
    }
    toast.success(editing ? "Budget updated" : "Budget added");
    setFormOpen(false);
    setEditing(null);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const budget = budgetsById.get(pendingDelete.id);
    setPendingDelete(null);
    if (!budget) return;

    try {
      await deleteBudget.mutateAsync(budget);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to delete budget."));
      return;
    }
    toast.success("Budget deleted");
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Budgets"
        icon={<PieChart className="h-5 w-5 text-primary" />}
      />

      <main className="space-y-4 p-3 sm:space-y-6 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MonthSelector month={month} onChange={setMonth} />
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" />
            New budget
          </Button>
        </div>

        {isError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            Failed to load budgets for {formatMonth(month)}.
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="size-8 text-muted-foreground" />
          </div>
        ) : statuses.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 text-center">
            <PieChart className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-foreground">
              No budgets yet
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Set a monthly limit for a category and this page tracks what you
              have spent against it, every month.
            </p>
            <Button onClick={handleNew} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Create your first budget
            </Button>
          </div>
        ) : (
          <>
            <BudgetSummaryCards statuses={statuses} />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {statuses.map((status) => (
                <BudgetCard
                  key={status.id}
                  status={status}
                  onEdit={handleEdit}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <BudgetFormModal
        row={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        onCancel={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        takenCategoryIds={takenCategoryIds}
      />

      <ConfirmDelete
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        close={() => setPendingDelete(null)}
        title="Delete budget?"
        description={
          pendingDelete
            ? `The ${pendingDelete.categoryName} budget will be removed. Your expenses are not affected.`
            : "This action cannot be undone."
        }
      />
    </div>
  );
}
