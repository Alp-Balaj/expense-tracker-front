import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Components/ui/alert-dialog";
import type { Account } from "@/Models/Account";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onConfirm: () => void;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  account,
  onConfirm,
}: DeleteAccountDialogProps) {
  if (!account) return null;

  // const formatCurrency = (amount: number, currency: string) => {
  //   return new Intl.NumberFormat("en-US", {
  //     style: "currency",
  //     currency: currency,
  //     minimumFractionDigits: 2,
  //   }).format(amount);
  // };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{account.name}</strong>?
            </span>
            <span className="block">
              This account has a balance of{" "}
              <strong className="text-foreground">
                {account.balance}{account.balanceCurrencyId}
              </strong>
              .
            </span>
            <span className="block text-destructive">
              This action cannot be undone. All associated expenses, incomes,
              and transactions will also be deleted.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}