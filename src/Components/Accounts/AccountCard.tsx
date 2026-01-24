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
import type { Account, AccountType } from "@/Models/Account";

interface AccountCardProps {
  account: Account;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
  onViewDetails?: (account: Account) => void;
}

const accountTypeColors: Record<AccountType, { bg: string; text: string }> = {
  checking: { bg: "bg-[#2d3142]", text: "text-white" },
  savings: { bg: "bg-[#4a5568]", text: "text-white" },
  cash: { bg: "bg-primary", text: "text-primary-foreground" },
  credit: { bg: "bg-[#1a365d]", text: "text-white" },
  investment: { bg: "bg-[#2f5f4a]", text: "text-white" },
};

const AccountTypeIcon = ({ type }: { type: AccountType }) => {
  const iconClass = "h-5 w-5";
  switch (type) {
    case "checking":
      return <Wallet className={iconClass} />;
    case "savings":
      return <PiggyBank className={iconClass} />;
    case "cash":
      return <Banknote className={iconClass} />;
    case "credit":
      return <CreditCard className={iconClass} />;
    case "investment":
      return <TrendingUp className={iconClass} />;
    default:
      return <Wallet className={iconClass} />;
  }
};

const accountTypeLabels: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  credit: "Credit",
  investment: "Investment",
};

export function AccountCard({
  account,
  onEdit,
  onDelete,
  onViewDetails,
}: AccountCardProps) {
  const colors = accountTypeColors[account.type] || accountTypeColors.checking;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card
      className={`${colors.bg} ${colors.text} border-0 overflow-hidden py-0 gap-0`}
    >
      <CardContent className="p-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-white/10">
              <AccountTypeIcon type={account.type} />
            </div>
            <div>
              <h3 className="font-medium opacity-90">{account.name}</h3>
              <p className="text-xs opacity-60">
                {accountTypeLabels[account.type]}
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
                <DropdownMenuItem onClick={() => onEdit(account)}>
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
            {formatCurrency(account.balance, account.currencyId)}
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
