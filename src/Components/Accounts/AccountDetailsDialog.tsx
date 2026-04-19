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
  if (!account) return null;

  const colorStyle = amountTypeColors[account.amountType];

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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
