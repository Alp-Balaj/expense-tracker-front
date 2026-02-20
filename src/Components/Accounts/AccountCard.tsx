import { useCurrency } from "@/Hooks/useCurrency";
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
import { useCallback, useEffect, useState } from "react";
import type { Currency } from "@/Models/Currency";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import { useAuth } from "@/Authorization/AuthContext";
import type { AxiosError } from "axios";

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

  // Replace local currency state + fetching
  const { format, convert, userCurrencyCode } = useCurrency();

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

          <DropdownMenu>{/* Dropdown code stays the same */}</DropdownMenu>
        </div>

        <div className="mb-4">
          <p className="text-xs opacity-60 mb-1">Available balance</p>
          <p className="text-2xl font-bold">
            {/* Convert + format using the hook */}
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
