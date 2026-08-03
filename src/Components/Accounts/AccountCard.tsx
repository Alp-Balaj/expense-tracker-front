import { ConvertedAmount } from "@/Components/General/ConvertedAmount";
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
  AlertTriangle,
} from "lucide-react";
import type { Account } from "@/Models/Account";
import { AmountType } from "@/Enums/enums";
import { usableBalance } from "@/lib/dashboard";

interface AccountCardProps {
  account: Account;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
  onViewDetails?: (account: Account) => void;
}

// type ColorPair = { bg: string; text: string };

export const amountTypeColors: Record<
  AmountType,
  { bg: string; text: string }
> = {
  [AmountType.CheckingAccount]: {
    bg: "bg-[#2d3142]",
    text: "text-white",
  },
  [AmountType.SavingsAccount]: {
    bg: "bg-[#4a5568]",
    text: "text-white",
  },
  [AmountType.Cash]: {
    bg: "bg-primary",
    text: "text-primary-foreground",
  },
  [AmountType.CreditCard]: {
    bg: "bg-[#1a365d]",
    text: "text-white",
  },
  [AmountType.Investment]: {
    bg: "bg-[#2f5f4a]",
    text: "text-white",
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

  // Both extra lines below are rendered only when there is something to say.
  // Most people have no savings goals, and they must not pay for this feature
  // with a taller card or an empty row where the reserved figure would go.
  const reserved = account.reservedAmount ?? 0;
  const shortfall = reserved - (account.balance ?? 0);

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
                size="icon"
                className="h-8 w-8 opacity-70 hover:opacity-100 hover:bg-white/10 text-current"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails?.(account)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(account)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(account)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-4">
          <p className="text-xs opacity-60 mb-1">Available balance</p>
          <p className="text-2xl font-bold">
            <ConvertedAmount
              amount={usableBalance(account)}
              fromCode={account.currencyCode}
            />
          </p>

          {reserved > 0 && (
            <p className="text-xs opacity-60 mt-1" data-testid="account-reserved">
              <ConvertedAmount amount={reserved} fromCode={account.currencyCode} /> reserved
              by goals
            </p>
          )}

          {/*
            Information, not an error: spending reserved money is allowed, and
            an account can legitimately sit short between a contribution and the
            transfer that funds it. The card paints its own dark surface in both
            themes, so it takes one fixed amber rather than the light/dark pair
            the rest of the app uses on --card.
          */}
          {shortfall > 0 && (
            <p
              className="flex items-start gap-1.5 mt-2 text-xs text-amber-300"
              data-testid="account-underfunded"
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                <ConvertedAmount amount={shortfall} fromCode={account.currencyCode} /> short
                of what goals reserved
              </span>
            </p>
          )}
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
