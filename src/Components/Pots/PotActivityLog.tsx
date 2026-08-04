import {
  ArrowRight,
  Link2,
  Link2Off,
  LogIn,
  LogOut,
  PiggyBank,
  Type,
  UserMinus,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { PotActivityKind, type PotActivity, type PotActivityKindValue } from "@/Models/Pot";

export interface PotActivityLogProps {
  entries: PotActivity[];
}

const ICONS: Record<PotActivityKindValue, LucideIcon> = {
  [PotActivityKind.PotCreated]: PiggyBank,
  [PotActivityKind.PotRenamed]: Type,
  [PotActivityKind.LowBalanceThresholdChanged]: PiggyBank,
  [PotActivityKind.InviteCreated]: Link2,
  [PotActivityKind.InviteRevoked]: Link2Off,
  [PotActivityKind.MemberJoined]: LogIn,
  [PotActivityKind.MemberLeft]: LogOut,
  [PotActivityKind.MemberAnonymized]: UserMinus,
};

/**
 * One line per entry, in the group's own words. The verb is built here rather
 * than stored, so the sentence can be reworded without rewriting history; the
 * *facts* — who, what, before, after — come from the row.
 */
function sentence(entry: PotActivity): string {
  const who = entry.actorDisplayName ?? "Someone";

  switch (entry.kind) {
    case PotActivityKind.PotCreated:
      return `${who} created this pot`;
    case PotActivityKind.PotRenamed:
      return `${who} renamed the pot`;
    case PotActivityKind.LowBalanceThresholdChanged:
      return `${who} changed the low-balance warning`;
    case PotActivityKind.InviteCreated:
      return `${who} created an invite link`;
    case PotActivityKind.InviteRevoked:
      return `${who} revoked an invite link`;
    case PotActivityKind.MemberJoined:
      return `${who} joined`;
    case PotActivityKind.MemberLeft:
      return `${who} left`;
    case PotActivityKind.MemberAnonymized:
      return `${who} deleted their account`;
    default:
      return `${who} changed something`;
  }
}

/**
 * The group's visible history.
 *
 * This is not a nice-to-have panel: trust inside a pot is flat — any member can
 * act on anything, including on other people's behalf — and the log is what
 * makes that workable. It is the accountability, so it is on the pot's main
 * screen rather than behind a tab.
 */
export default function PotActivityLog({ entries }: PotActivityLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Activity</CardTitle>
        <CardDescription>
          Everything anyone does in this pot, attributed and timestamped.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing has happened yet.</p>
        ) : (
          <ol className="space-y-3">
            {entries.map((entry) => {
              const Icon = ICONS[entry.kind] ?? PiggyBank;

              return (
                <li key={entry.id} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{sentence(entry)}</p>

                    {entry.before && entry.after ? (
                      <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        <span className="line-through">{entry.before}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{entry.after}</span>
                      </p>
                    ) : null}

                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.occurredAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
