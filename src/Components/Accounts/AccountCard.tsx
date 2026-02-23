import { useCurrency } from "@/Hooks/useCurrency";
import { Card, CardContent, CardFooter } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import {
  DropdownMenu,
} from "@/Components/ui/dropdown-menu";
import {
  Wallet,
  PiggyBank,
  Banknote,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import type { Account } from "@/Models/Account";
import { AmountTypeColors, AccountTypeLabels } from "@/Models/Account";
import { AmountType } from "@/Enums/enums";

interface AccountCardProps {
  account: Account;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
  onViewDetails?: (account: Account) => void;
}

export const AmountTypeIcon = ({ type }: { type: AmountType }) => {
  const iconClass = "h-5 w-5";
  switch (type) {
    case AmountType.CheckingAccount:
      return <Wallet className={iconClass} />;
    case AmountType.SavingsAccount:
      return <PiggyBank className={iconClass} />;
    case AmountType.Cash:
      return <Banknote className={iconClass} />;
    case AmountType.CreditCard:
      return <CreditCard className={iconClass} />;
    case AmountType.Investment:
      return <TrendingUp className={iconClass} />;
    default:
      return <Wallet className={iconClass} />;
  }
};

export function AccountCard({
  account,
  onViewDetails,
}: AccountCardProps) {
  const colorStyle = AmountTypeColors[account.amountType];

  const { format } = useCurrency();

  return (
    <Card
      className={`${colorStyle.bg} ${colorStyle.text} border-0 overflow-hidden py-0 gap-0`}
    >
      <CardContent className="p-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-white/10">
              <AmountTypeIcon type={account.amountType} />
            </div>
            <div>
              <h3 className="font-medium opacity-90">{account.name}</h3>
              <p className="text-xs opacity-60">
                {AccountTypeLabels[account.amountType]}
              </p>
            </div>
          </div>

          <DropdownMenu>{/* Dropdown code stays the same */}</DropdownMenu>
        </div>

        <div className="mb-4">
          <p className="text-xs opacity-60 mb-1">Available balance</p>
          <p className="text-2xl font-bold">
            {format(account.balance, account.currencyCode)}
          </p>
        </div>

        {account.description && (
          <p className="text-sm opacity-70 line-clamp-2">
            {account.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-0">
        <Button
          variant="ghost"
          className="w-full rounded-t-none border-t border-white/10 opacity-80 hover:opacity-100 hover:bg-white/10 h-11 text-current"
          onClick={() => onViewDetails?.(account)}
        >
          See details
        </Button>
      </CardFooter>
    </Card>
  );
}
