import { useNavigate, useParams } from "react-router-dom";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import LoadingSpinner from "@/Components/General/LoadingSpinner";
import { getApiErrorMessage } from "@/lib/errors";
import { useJoinPot, usePotInvitePreviewQuery } from "@/Hooks/queries/usePots";

/**
 * Where an invite link lands.
 *
 * Behind RequireAuth on purpose: joining is an act by a specific person, so a
 * signed-out visitor is bounced to login and comes back here. What the screen
 * shows before they accept is deliberately thin — the pot's name, its currency,
 * and who invited them. Not the member list, not the history, not a count.
 * Holding a code is enough to be told what you are being asked to join, and no
 * more.
 */
export default function JoinPotPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const { data: preview, isLoading, isError } = usePotInvitePreviewQuery(code);
  const joinPot = useJoinPot();

  if (isLoading) return <LoadingSpinner />;

  const handleJoin = async () => {
    if (!code) return;
    try {
      const pot = await joinPot.mutateAsync(code);
      toast.success(`You joined ${pot.name}.`);
      navigate(`/pots/${pot.id}`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not join that pot."));
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 p-4 md:p-6">
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <span
            aria-hidden
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <Users className="h-5 w-5" />
          </span>

          {isError || !preview ? (
            <>
              <p className="font-medium text-foreground">This invite link is not valid</p>
              <p className="text-sm text-muted-foreground">
                Ask whoever sent it for a new one.
              </p>
              <Button variant="outline" onClick={() => navigate("/pots")}>
                Go to pots
              </Button>
            </>
          ) : preview.alreadyAMember ? (
            <>
              <p className="font-medium text-foreground">
                You are already in {preview.potName}
              </p>
              <p className="text-sm text-muted-foreground">
                Nothing to accept — the link has already done its job.
              </p>
              <Button onClick={() => navigate("/pots")}>Open pots</Button>
            </>
          ) : !preview.isRedeemable ? (
            <>
              <p className="font-medium text-foreground">
                {preview.invitedByDisplayName} invited you to {preview.potName}
              </p>
              {/* The server tells revoked and expired apart, because "ask for a
                  new link" and "that was cancelled" are different next steps. */}
              <p className="text-sm text-muted-foreground">{preview.problem}</p>
              <Button variant="outline" onClick={() => navigate("/pots")}>
                Go to pots
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {preview.invitedByDisplayName} invited you to
              </p>
              <p className="text-lg font-semibold text-foreground">{preview.potName}</p>
              <p className="text-sm text-muted-foreground">
                A shared pot in {preview.currencyCode}. Members can see everything that happens
                in it — and nothing outside it.
              </p>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
                <Button onClick={handleJoin} disabled={joinPot.isPending} className="h-11">
                  Join {preview.potName}
                </Button>
                <Button variant="ghost" onClick={() => navigate("/pots")} className="h-11">
                  Not now
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
