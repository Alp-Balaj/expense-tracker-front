import { useState } from "react";
import { Check, Copy, Link2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { getApiErrorMessage } from "@/lib/errors";
import { useCreatePotInvite, useRevokePotInvite } from "@/Hooks/queries/usePots";
import type { PotInvite } from "@/Models/Pot";

export interface PotInvitePanelProps {
  potId: string;
  invites: PotInvite[];
}

/** The link a member pastes into a group chat. */
export function joinUrl(code: string): string {
  return `${window.location.origin}/join/${code}`;
}

/**
 * Invites, and the two things a member does with them: make one, and kill one.
 *
 * Any member may revoke any invite, including one somebody else issued — trust
 * inside a pot is flat, and the activity log rather than a permission check is
 * what makes that safe. The link itself is only ever shown here, never in the
 * log, because the log is readable forever and a revoked code sitting in it
 * would not be revoked in any sense that matters.
 */
export default function PotInvitePanel({ potId, invites }: PotInvitePanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const createInvite = useCreatePotInvite();
  const revokeInvite = useRevokePotInvite();

  const live = invites.filter((i) => i.isRedeemable);
  const dead = invites.filter((i) => !i.isRedeemable);

  const handleCreate = async () => {
    try {
      const invite = await createInvite.mutateAsync(potId);
      await copy(invite.code);
      toast.success("Invite link created and copied");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not create an invite."));
    }
  };

  const copy = async (code: string) => {
    const url = joinUrl(code);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(code);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard access is refused often enough — on http origins, in some
      // in-app browsers — that failing silently would look like a broken
      // button. Show the link so it can still be copied by hand.
      toast.info(url, { duration: 20000 });
    }
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      await revokeInvite.mutateAsync({ potId, inviteId });
      toast.success("Invite revoked. The link no longer works.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not revoke that invite."));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Invite people</CardTitle>
        <CardDescription>
          Share a link. Nobody is added to a pot without opening it themselves.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          type="button"
          onClick={handleCreate}
          disabled={createInvite.isPending}
          className="h-11 w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          New invite link
        </Button>

        {live.length === 0 && dead.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No invites yet.
          </p>
        ) : null}

        {live.map((invite) => (
          <div
            key={invite.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3"
          >
            <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <code className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {joinUrl(invite.code)}
            </code>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copy(invite.code)}
              aria-label="Copy invite link"
            >
              {copied === invite.code ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRevoke(invite.id)}
              disabled={revokeInvite.isPending}
              aria-label="Revoke invite"
            >
              <X className="h-4 w-4" />
            </Button>

            <p className="w-full text-xs text-muted-foreground">
              From {invite.issuedByDisplayName} · expires{" "}
              {new Date(invite.expiresAt).toLocaleDateString()}
            </p>
          </div>
        ))}

        {dead.length > 0 && (
          <div className="space-y-2">
            {dead.map((invite) => (
              <div key={invite.id} className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                <Badge variant="outline">{invite.revokedAt ? "Revoked" : "Expired"}</Badge>
                <span className="truncate">
                  issued by {invite.issuedByDisplayName}
                  {invite.revokedByDisplayName ? `, revoked by ${invite.revokedByDisplayName}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
