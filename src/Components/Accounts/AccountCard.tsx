import { Card, CardContent, CardFooter } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
  Wallet,
  PiggyBank,
  Banknote,
  CreditCard,
  TrendingUp,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import type { Account } from "@/Models/Account";
import { AmountType } from "@/Enums/enums";

interface AccountCardProps {
  account: Account;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
  onViewDetails?: (account: Account) => void;
}

// type ColorPair = { bg: string; text: string };

export const amountTypeColors: Record<AmountType, { bg: string; text: string }> = {
  [AmountType.CheckingAccount]: { 
    bg: "bg-[#2d3142]", 
    text: "text-white" 
  },
  [AmountType.SavingsAccount]: { 
    bg: "bg-[#4a5568]", 
    text: "text-white" 
  },
  [AmountType.Cash]: { 
    bg: "bg-primary", 
    text: "text-primary-foreground" 
  },
  [AmountType.CreditCard]: { 
    bg: "bg-[#1a365d]", 
    text: "text-white" 
  },
  [AmountType.Investment]: { 
    bg: "bg-[#2f5f4a]", 
    text: "text-white" 
  },
};

export const accountTypeLabels: Record<AmountType, string> = {
  [AmountType.CheckingAccount]: "Checking",
  [AmountType.SavingsAccount]: "Savings",
  [AmountType.Cash]: "Cash",
  [AmountType.CreditCard]: "Credit",
  [AmountType.Investment]: "Investment",
};

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
  onEdit,
  onDelete,
  onViewDetails,
}: AccountCardProps) {
  const colorStyle = amountTypeColors[account.amountType];
  // const formatCurrency = (amount: number, currency: string) => {
  //   return new Intl.NumberFormat("en-US", {
  //     style: "currency",
  //     currency: currency,
  //     minimumFractionDigits: 2,
  //   }).format(amount);
  // };

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
                {accountTypeLabels[account.amountType]}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Account options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewDetails && (
                <DropdownMenuItem onClick={() => onViewDetails(account)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit?.(account)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(account)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-4">
          <p className="text-xs opacity-60 mb-1">Available balance</p>
          <p className="text-2xl font-bold">
            {account.balance}{account.currencyId}
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
