import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Receipt, Trash2, Wallet } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import ConfirmDelete from "@/Components/General/ConfirmDelete";
import { formatPotAmount } from "@/lib/potMoney";
import { cn } from "@/lib/utils";
import { PotLedgerEntryKind, type PotLedger, type PotLedgerEntry } from "@/Models/Pot";

export interface PotLedgerListProps {
  ledger: PotLedger;
  onDeleteExpense: (entry: PotLedgerEntry) => Promise<void>;
}

const ICONS = {
  [PotLedgerEntryKind.TopUp]: ArrowDownToLine,
  [PotLedgerEntryKind.Expense]: Receipt,
  [PotLedgerEntryKind.Withdrawal]: ArrowUpFromLine,
} as const;

/**
 * What happened to the money: top-ups, expenses and withdrawals as one feed,
 * newest first.
 *
 * One list rather than three, because a member reading a pot wants "what
 * happened to the money" and would otherwise have to interleave three by eye.
 * The activity log next to it is a different thing — it records renames and
 * invites too, and it is the accountability rather than the arithmetic.
 *
 * An expense shows its shares underneath, because who a bill was for is the
 * fact somebody is most likely to want to check, and burying it behind a tap
 * would make the feature feel like it was hiding something.
 */
export default function PotLedgerList({ ledger, onDeleteExpense }: PotLedgerListProps) {
  const [pendingDelete, setPendingDelete] = useState<PotLedgerEntry | null>(null);

  const sign = (entry: PotLedgerEntry) => {
    // From the pot's point of view. A fronted expense is deliberately neutral:
    // the pot's cash did not move, the payer's did.
    if (entry.kind === PotLedgerEntryKind.TopUp) return "+";
    if (entry.kind === PotLedgerEntryKind.Expense) return entry.paidByMembershipId ? "" : "−";
    return "−";
  };

  const line = (entry: PotLedgerEntry): string => {
    const who = entry.actorDisplayName ?? "Someone";

    switch (entry.kind) {
      case PotLedgerEntryKind.TopUp:
        return `${who} added money`;
      case PotLedgerEntryKind.Withdrawal:
        return `${who} took money out`;
      default:
        return entry.paidByDisplayName
          ? `${entry.paidByDisplayName} paid for this`
          : `${who} logged this`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Money</CardTitle>
        <CardDescription>
          Everything in and out of this pot, newest first.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {ledger.entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing yet. Add money to the pot, or log something the group has already paid
            for.
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {ledger.entries.map((entry) => {
              const Icon = ICONS[entry.kind] ?? Receipt;
              const isExpense = entry.kind === PotLedgerEntryKind.Expense;

              return (
                <li key={entry.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      entry.kind === PotLedgerEntryKind.TopUp
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="min-w-0 font-medium text-foreground">
                        {entry.title ?? (isExpense ? "Shared expense" : "—")}
                      </p>
                      <p className="shrink-0 tabular-nums text-foreground">
                        {sign(entry)}
                        {formatPotAmount(entry.amount, ledger.currencyCode)}
                      </p>
                    </div>

                    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                      <span>{line(entry)}</span>
                      <span aria-hidden>·</span>
                      <span>{entry.date}</span>
                      {entry.paidByDisplayName && (
                        <>
                          <span aria-hidden>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Wallet aria-hidden className="h-3 w-3" />
                            out of pocket
                          </span>
                        </>
                      )}
                    </p>

                    {isExpense && entry.shares.length > 0 && (
                      <ul className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5 text-xs text-muted-foreground">
                        {entry.shares.map((share) => (
                          <li key={share.membershipId} className="tabular-nums">
                            <span className={cn(share.isYou && "font-medium text-foreground")}>
                              {share.isYou ? "You" : share.displayName}
                            </span>{" "}
                            {formatPotAmount(share.amount, ledger.currencyCode)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {isExpense && entry.canDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${entry.title ?? "this expense"}`}
                      onClick={() => setPendingDelete(entry)}
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>

      <ConfirmDelete
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        close={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await onDeleteExpense(pendingDelete);
          setPendingDelete(null);
        }}
        title={`Remove "${pendingDelete?.title ?? "this expense"}"?`}
        description={
          pendingDelete?.paidByMembershipId
            ? "Everyone's share of it goes too, and the money goes back to the account you paid from. Everyone sees that you removed it."
            : "Everyone's share of it goes too, and the pot gets the money back. Everyone sees that you removed it."
        }
        confirmLabel="Remove expense"
      />
    </Card>
  );
}
