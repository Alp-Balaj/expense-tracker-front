import { useMemo, useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/Components/ui/button";
import { Spinner } from "@/Components/ui/spinner";
import ConfirmDelete from "@/Components/General/ConfirmDelete";
import { DueQueue } from "@/Components/Planned/DueQueue";
import { PlannedCard } from "@/Components/Planned/PlannedCard";
import PlannedFormModal from "@/Components/Planned/PlannedFormModal";
import CommitOccurrenceDialog from "@/Components/Planned/CommitOccurrenceDialog";

import type {
  CommitOccurrence,
  PlannedOccurrence,
  PlannedTransaction,
} from "@/Models/PlannedTransaction";
import { getApiErrorMessage } from "@/lib/errors";
import { sortTemplates } from "@/lib/planned";
import {
  useCommitOccurrence,
  useCreatePlannedTransaction,
  useDeletePlannedTransaction,
  usePlannedOccurrencesQuery,
  usePlannedTransactionsQuery,
  useSkipOccurrence,
  useUpdatePlannedTransaction,
} from "@/Hooks/queries/usePlannedTransactions";

/**
 * Everything you already know is coming — rent and subscriptions alongside
 * one-off future-dated payments, because they are the same thing at different
 * cadences.
 *
 * The due queue leads and the schedules follow: the queue is the only part that
 * wants anything from you.
 */
export default function PlannedPage() {
  const { data: plans = [], isLoading, isError } = usePlannedTransactionsQuery();
  const { data: occurrences = [] } = usePlannedOccurrencesQuery();

  const createPlan = useCreatePlannedTransaction();
  const updatePlan = useUpdatePlannedTransaction();
  const deletePlan = useDeletePlannedTransaction();
  const commitOccurrence = useCommitOccurrence();
  const skipOccurrence = useSkipOccurrence();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlannedTransaction | null>(null);
  const [committing, setCommitting] = useState<PlannedOccurrence | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PlannedTransaction | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const ordered = useMemo(() => sortTemplates(plans), [plans]);

  const handleNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (plan: PlannedTransaction) => {
    setEditing(plan);
    setFormOpen(true);
  };

  const handleSubmit = async (data: PlannedTransaction) => {
    try {
      if (editing) await updatePlan.mutateAsync(data);
      else await createPlan.mutateAsync(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to save the plan."));
      throw e; // the modal stays open so the user can correct it
    }
    toast.success(editing ? "Plan updated" : "Plan added");
    setFormOpen(false);
    setEditing(null);
  };

  // Pausing is an ordinary update with one field flipped, so it goes through the
  // same endpoint and invalidations as an edit.
  const handleTogglePause = async (plan: PlannedTransaction) => {
    try {
      await updatePlan.mutateAsync({ ...plan, isActive: !plan.isActive });
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to update the plan."));
      return;
    }
    toast.success(plan.isActive ? "Plan paused" : "Plan resumed");
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const plan = pendingDelete;
    setPendingDelete(null);

    try {
      await deletePlan.mutateAsync(plan);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to delete the plan."));
      return;
    }
    toast.success("Plan deleted");
  };

  const handleCommit = async (id: string, commit: CommitOccurrence) => {
    setBusyId(id);
    try {
      await commitOccurrence.mutateAsync({ id, commit });
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to confirm."));
      throw e; // keeps the dialog open
    } finally {
      setBusyId(null);
    }
    toast.success("Recorded");
    setCommitting(null);
  };

  const handleSkip = async (occurrence: PlannedOccurrence) => {
    setBusyId(occurrence.id);
    try {
      await skipOccurrence.mutateAsync(occurrence.id);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to skip."));
      return;
    } finally {
      setBusyId(null);
    }
    toast.success(`${occurrence.title} skipped`);
  };

  return (
    <>
      <main className="space-y-4 p-3 sm:space-y-6 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Planned</h1>
            <p className="text-sm text-muted-foreground">
              Rent, subscriptions, salary, and one-off payments you know are coming.
            </p>
          </div>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" />
            New plan
          </Button>
        </div>

        {isError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            Failed to load your planned transactions.
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="size-8 text-muted-foreground" />
          </div>
        ) : plans.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 text-center">
            <CalendarClock className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-foreground">Nothing planned yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Add rent, a subscription or your salary once and it will show up here
              whenever it falls due — waiting for you to confirm what actually
              happened. Nothing is ever posted behind your back.
            </p>
            <Button onClick={handleNew} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add your first plan
            </Button>
          </div>
        ) : (
          <>
            <DueQueue
              occurrences={occurrences}
              onCommit={setCommitting}
              onSkip={handleSkip}
              busyId={busyId}
            />

            <div>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                Your schedules
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ordered.map((plan) => (
                  <PlannedCard
                    key={plan.id}
                    plan={plan}
                    onEdit={handleEdit}
                    onTogglePause={handleTogglePause}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <PlannedFormModal
        row={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        onCancel={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <CommitOccurrenceDialog
        occurrence={committing}
        open={committing !== null}
        onOpenChange={(open) => !open && setCommitting(null)}
        onSubmit={handleCommit}
      />

      <ConfirmDelete
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        close={() => setPendingDelete(null)}
        title="Delete this plan?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" and anything of its still waiting to be confirmed will be removed. Transactions you have already confirmed are not affected.`
            : "This action cannot be undone."
        }
      />
    </>
  );
}
