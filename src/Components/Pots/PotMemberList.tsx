import { UserMinus } from "lucide-react";

import { Badge } from "@/Components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { initials } from "@/lib/identity";
import { cn } from "@/lib/utils";
import type { PotMember } from "@/Models/Pot";

export interface PotMemberListProps {
  members: PotMember[];
}

/**
 * Who is in the pot, in join order — which is also the order W2's rounding
 * tie-break will read, so it is worth showing as it is rather than
 * alphabetically.
 *
 * People who have left stay on the list, greyed and labelled. A pot's history
 * keeps naming them, so hiding them here would leave the activity log full of
 * people the member list says do not exist.
 */
export default function PotMemberList({ members }: PotMemberListProps) {
  const active = members.filter((m) => m.isActive);
  const past = members.filter((m) => !m.isActive);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Members</CardTitle>
        <CardDescription>
          {active.length} {active.length === 1 ? "person" : "people"} in this pot
          {past.length > 0 ? `, ${past.length} who left` : ""}. Everyone has the same rights.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {[...active, ...past].map((member) => (
          <div
            key={member.id}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-2",
              !member.isActive && "opacity-60",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                member.isActive
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {member.isAnonymized ? <UserMinus className="h-4 w-4" /> : initials(member.displayName)}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {member.displayName}
              </p>
              <p className="text-xs text-muted-foreground">
                {member.isActive
                  ? `Joined ${new Date(member.joinedAt).toLocaleDateString()}`
                  : member.isAnonymized
                    ? "Account deleted — their share of the history stays"
                    : `Left ${member.leftAt ? new Date(member.leftAt).toLocaleDateString() : ""}`}
              </p>
            </div>

            {member.isYou && <Badge variant="secondary">You</Badge>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
