import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LogOut, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import ConfirmDelete from "@/Components/General/ConfirmDelete";
import LoadingSpinner from "@/Components/General/LoadingSpinner";
import PotActivityLog from "@/Components/Pots/PotActivityLog";
import PotBalanceHeader from "@/Components/Pots/PotBalanceHeader";
import PotExpenseModal from "@/Components/Pots/PotExpenseModal";
import PotFormModal from "@/Components/Pots/PotFormModal";
import PotInvitePanel from "@/Components/Pots/PotInvitePanel";
import PotLedgerList from "@/Components/Pots/PotLedgerList";
import PotMemberList from "@/Components/Pots/PotMemberList";
import PotMoveModal from "@/Components/Pots/PotMoveModal";
import PotPositionsTable from "@/Components/Pots/PotPositionsTable";
import { getApiErrorMessage } from "@/lib/errors";
import { currencySymbol } from "@/lib/identity";
import { formatPotAmount } from "@/lib/potMoney";
import type { CreatePotExpense, PotLedgerEntry } from "@/Models/Pot";
import {
  useDeletePotExpense,
  useLeavePot,
  useLogPotExpense,
  usePotActivityQuery,
  usePotInvitesQuery,
  usePotLedgerQuery,
  usePotMembersQuery,
  usePotQuery,
  usePotTopUp,
  usePotWithdrawal,
  useUpdatePot,
} from "@/Hooks/queries/usePots";

/**
 * One pot: what is in it, whose it is, who is in the group, and everything that
 * has happened.
 *
 * <h3>Money first</h3>
 * W1 shipped this screen without any, deliberately. W2 puts the balance and the
 * reader's own position at the top, because those are what somebody opens a pot
 * to find out — the member list and the invite panel are things you need
 * occasionally, and they move below.
 *
 * <h3>Two lists, and they are different things</h3>
 * The money feed is the arithmetic: what came in, what was spent, who each
 * expense was for. The activity log is the accountability: it records renames
 * and invites too, and it exists because trust inside a pot is flat. Collapsing
 * them would lose the second one inside the first.
 *
 * A pot the reader is not (or is no longer) a member of answers 404, so the
 * not-found state below is the same one a stranger sees — the screen cannot
 * tell the difference either, which is the point.
 */
export default function PotDetailPage() {
  const { potId } = useParams<{ potId: string }>();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { data: pot, isLoading, isError } = usePotQuery(potId);
  const { data: members = [] } = usePotMembersQuery(potId);
  const { data: invites = [] } = usePotInvitesQuery(potId);
  const { data: activity = [] } = usePotActivityQuery(potId);
  const { data: ledger } = usePotLedgerQuery(potId);

  const updatePot = useUpdatePot();
  const leavePot = useLeavePot();
  const topUp = usePotTopUp();
  const logExpense = useLogPotExpense();
  const deleteExpense = useDeletePotExpense();
  const withdraw = usePotWithdrawal();

  if (isLoading) return <LoadingSpinner />;

  if (isError || !pot || !potId) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="font-medium text-foreground">This pot is not available</p>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Either it does not exist, or you are not a member of it.
            </p>
            <Button asChild variant="outline">
              <Link to="/pots">Back to pots</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEdit = async (data: { name: string; lowBalanceThreshold: number }) => {
    try {
      await updatePot.mutateAsync({ id: potId, pot: data });
      toast.success("Pot updated. Everyone can see the change.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not update that pot."));
      throw e;
    }
  };

  const handleLeave = async () => {
    try {
      await leavePot.mutateAsync(potId);
      setLeaveOpen(false);
      toast.success(`You left ${pot.name}.`);
      navigate("/pots");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not leave that pot."));
    }
  };

  // Every one of these rethrows so the modal stays open with what was typed
  // still in it — the amount and the split are more than a moment's work, and
  // losing them to a failed request is the difference between a retry and
  // giving up. See PotMoveModal / PotExpenseModal.

  const handleTopUp = async (move: {
    amount: number;
    accountId: string;
    date: string;
    note: string | null;
  }) => {
    try {
      const result = await topUp.mutateAsync({
        potId,
        topUp: {
          amount: move.amount,
          sourceAccountId: move.accountId,
          date: move.date,
          note: move.note,
        },
      });
      toast.success(
        `Added ${formatPotAmount(move.amount, result.currencyCode)} to ${pot.name}.`,
      );
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not add that money."));
      throw e;
    }
  };

  const handleWithdraw = async (move: {
    amount: number;
    accountId: string;
    date: string;
    note: string | null;
  }) => {
    try {
      const result = await withdraw.mutateAsync({
        potId,
        withdrawal: {
          amount: move.amount,
          destinationAccountId: move.accountId,
          date: move.date,
          note: move.note,
        },
      });
      toast.success(`Took ${formatPotAmount(move.amount, result.currencyCode)} out.`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not take that money out."));
      throw e;
    }
  };

  const handleLogExpense = async (expense: CreatePotExpense) => {
    try {
      await logExpense.mutateAsync({ potId, expense });
      toast.success("Logged. Everyone's position has moved.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not log that expense."));
      throw e;
    }
  };

  const handleDeleteExpense = async (entry: PotLedgerEntry) => {
    try {
      await deleteExpense.mutateAsync({ potId, expenseId: entry.id });
      toast.success("Removed, and everyone's share with it.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not remove that expense."));
    }
  };

  const activeMembers = members.filter((m) => m.isActive);
  const you = ledger?.positions.find((p) => p.isYou);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to="/pots">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Pots
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-xl font-semibold tracking-[-0.01em]">{pot.name}</h1>
            <p className="text-sm text-muted-foreground">
              {pot.currencyCode}
              {pot.lowBalanceThreshold > 0
                ? ` · warns below ${currencySymbol(pot.currencyCode)}${pot.lowBalanceThreshold}`
                : " · low-balance warning off"}
              {pot.createdByDisplayName ? ` · started by ${pot.createdByDisplayName}` : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button type="button" variant="ghost" onClick={() => setLeaveOpen(true)}>
              <LogOut className="mr-2 h-4 w-4" />
              Leave
            </Button>
          </div>
        </div>
      </div>

      {ledger && (
        <PotBalanceHeader
          ledger={ledger}
          onTopUp={() => setTopUpOpen(true)}
          onLogExpense={() => setExpenseOpen(true)}
          onWithdraw={() => setWithdrawOpen(true)}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {ledger && <PotLedgerList ledger={ledger} onDeleteExpense={handleDeleteExpense} />}
          <PotMemberList members={members} />
          <PotInvitePanel potId={potId} invites={invites} />
        </div>

        <div className="space-y-4">
          {ledger && <PotPositionsTable ledger={ledger} />}
          <PotActivityLog entries={activity} />
        </div>
      </div>

      <PotFormModal pot={pot} open={editOpen} onOpenChange={setEditOpen} onSubmit={handleEdit} />

      <PotExpenseModal
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        members={activeMembers}
        currencyCode={pot.currencyCode}
        onSubmit={handleLogExpense}
      />

      <PotMoveModal
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        direction="in"
        currencyCode={pot.currencyCode}
        onSubmit={handleTopUp}
      />

      <PotMoveModal
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        direction="out"
        currencyCode={pot.currencyCode}
        limit={you?.withdrawable ?? 0}
        onSubmit={handleWithdraw}
      />

      <ConfirmDelete
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        close={() => setLeaveOpen(false)}
        onConfirm={handleLeave}
        title={`Leave ${pot.name}?`}
        description="You will stop seeing this pot. What you did in it stays in the group's history, and you can rejoin with a new invite link."
        confirmLabel="Leave pot"
      />
    </div>
  );
}
