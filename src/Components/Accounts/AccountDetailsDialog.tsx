import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Badge } from "@/Components/ui/badge";
import { Separator } from "@/Components/ui/separator";
import type { Account } from "@/Models/Account";
import {
  amountTypeColors,
  accountTypeLabels,
  AmountTypeIcon,
} from "@/Components/Accounts/AccountCard";
import { ConvertedAmount } from "@/Components/General/ConvertedAmount";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useTransfersQuery } from "@/Hooks/queries/useTransfers";
import { formatDate } from "@/lib/dates";

interface AccountDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

export function AccountDetailsDialog({
  open,
  onOpenChange,
  account,
}: AccountDetailsDialogProps) {
  // Hooks stay above the `!account` bail-out — the dialog renders with a null
  // account between closing and the parent clearing its selection.
  const { data: allTransfers = [] } = useTransfersQuery();
  const { data: accounts = [] } = useAccountsQuery();

  const transfers = useMemo(() => {
    if (!account) return [];
    return allTransfers
      .filter((t) => t.fromAccountId === account.id || t.toAccountId === account.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allTransfers, account]);

  if (!account) return null;

  const colorStyle = amountTypeColors[account.amountType];
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "another account";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header banner */}
          <div
            className={`${colorStyle.bg} ${colorStyle.text} rounded-lg p-4 flex items-center gap-3`}
          >
            <div className="p-2 rounded-md bg-white/10">
              <AmountTypeIcon type={account.amountType} />
            </div>
            <div>
              <p className="font-semibold text-lg">{account.name}</p>
              <p className="text-sm opacity-70">
                {accountTypeLabels[account.amountType]}
              </p>
            </div>
          </div>

          <Separator />

          {/* Details rows */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-semibold text-base text-right">
                <ConvertedAmount amount={account.balance} fromCode={account.currencyCode} />
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Currency</span>
              <Badge variant="outline">{account.currencyCode}</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Type</span>
              <Badge variant="secondary">
                {accountTypeLabels[account.amountType]}
              </Badge>
            </div>

            {account.description && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1">Description</p>
                  <p className="text-foreground">{account.description}</p>
                </div>
              </>
            )}

            {transfers.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-2">Transfers</p>
                  <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {transfers.map((transfer) => {
                      const isOutgoing = transfer.fromAccountId === account.id;
                      const counterparty = isOutgoing
                        ? transfer.toAccountId
                        : transfer.fromAccountId;

                      return (
                        <li key={transfer.id} className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0">
                            {isOutgoing ? (
                              <ArrowUpRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                            ) : (
                              <ArrowDownLeft className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-foreground">
                                {isOutgoing ? "To" : "From"} {accountName(counterparty)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(transfer.date)}
                                {transfer.note ? ` · ${transfer.note}` : ""}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 text-right font-medium tabular-nums ${
                              isOutgoing ? "text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {isOutgoing ? "−" : "+"}
                            <ConvertedAmount
                              amount={transfer.amount}
                              fromCode={account.currencyCode}
                            />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
