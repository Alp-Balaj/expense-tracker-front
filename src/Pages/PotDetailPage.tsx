import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LogOut, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import ConfirmDelete from "@/Components/General/ConfirmDelete";
import LoadingSpinner from "@/Components/General/LoadingSpinner";
import PotActivityLog from "@/Components/Pots/PotActivityLog";
import PotFormModal from "@/Components/Pots/PotFormModal";
import PotInvitePanel from "@/Components/Pots/PotInvitePanel";
import PotMemberList from "@/Components/Pots/PotMemberList";
import { getApiErrorMessage } from "@/lib/errors";
import { currencySymbol } from "@/lib/identity";
import {
  useLeavePot,
  usePotActivityQuery,
  usePotInvitesQuery,
  usePotMembersQuery,
  usePotQuery,
  useUpdatePot,
} from "@/Hooks/queries/usePots";

/**
 * One pot: who is in it, how to let somebody else in, and everything that has
 * happened.
 *
 * There is no money on this screen and there is not supposed to be. W1 ships
 * the group; the balance header, the top-up flow and the positions table are
 * W2's, and they arrive with the invariant that keeps them honest.
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

  const { data: pot, isLoading, isError } = usePotQuery(potId);
  const { data: members = [] } = usePotMembersQuery(potId);
  const { data: invites = [] } = usePotInvitesQuery(potId);
  const { data: activity = [] } = usePotActivityQuery(potId);

  const updatePot = useUpdatePot();
  const leavePot = useLeavePot();

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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <PotMemberList members={members} />
          <PotInvitePanel potId={potId} invites={invites} />
        </div>

        <PotActivityLog entries={activity} />
      </div>

      <PotFormModal pot={pot} open={editOpen} onOpenChange={setEditOpen} onSubmit={handleEdit} />

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
