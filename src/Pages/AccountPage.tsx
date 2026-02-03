import { useCallback, useEffect, useState } from "react";
import { Wallet, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { AccountCard } from "@/Components/Accounts/AccountCard";
import { AccountSummary } from "@/Components/Accounts/AccountSummary";
import { AccountForm } from "@/Components/Accounts/AccountForm";
import { DeleteAccountDialog } from "@/Components/Accounts/DeleteAccountDialog";
import type { Account, AddAccount } from "@/Models/Account";
import { AmountType } from "@/Enums/enums";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import type { AxiosError } from "axios";
import { PageHeader } from "@/Components/General/PageHeader";

export default function AccountPage() {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData, postData, putData } = useAuthorizationApi();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accountLoadError, setAccountLoadError] = useState<string | null>(null);

  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    setAccountLoadError(null);
    try {
      const data = await getAllData<Account[]>("api/Account");
      setAccounts(data);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        setAccountLoadError("Failed to load accounts.");
        console.error(accountLoadError);
      }
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [getAllData]);

  const handleSaveAccount = useCallback(
    async (account: AddAccount) => {
      setIsLoadingAccounts(true);
      if (account.id === null) {
        try {
          await postData<AddAccount>("api/Account", account);
        } catch (e: unknown) {
          const err = e as AxiosError;
          if (err.response?.status !== 401) {
            console.error(err);
            setAccountLoadError("Failed to add account.");
          }
        } finally {
          setIsLoadingAccounts(false);
        }
        fetchAccounts();
      } else {
        try {
          await putData<AddAccount>("api/Account", account as AddAccount);
        } catch (e: unknown) {
          const err = e as AxiosError;
          if (err.response?.status !== 401) {
            console.error(err);
            setAccountLoadError("Failed to edit account.");
          }
        } finally {
          setIsLoadingAccounts(false);
        }
        fetchAccounts();
      }
      setEditingAccount(null);
    },
    [postData, putData, fetchAccounts],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  const [amountType, setAmountType] = useState<AmountType | "all">("all");
  const currentType =
    amountType != "all" ? amountType : AmountType.CheckingAccount;

  // Filter accounts based on search and type
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      amountType === "all" || account.amountType === amountType;
    return matchesSearch && matchesType;
  });

  const handleDeleteAccount = () => {
    if (!deletingAccount) return;
    setAccounts(accounts.filter((acc) => acc.id !== deletingAccount.id));
    setDeletingAccount(null);
  };

  const handleViewDetails = (account: Account) => {
    // In production, this would navigate to a details page or open a details modal
    console.log("View details for:", account.name);
  };

  useEffect(() => {
    if (!isAuthReady || !accessToken) return;
    if (!isLoadingAccounts) fetchAccounts();
  }, [fetchAccounts, isAuthReady, accessToken]);

  const handleAddAccount = () => {
    setEditingAccount(null);
    setAccountDialogOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAccountDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader
        title="Accounts"
        icon={<Wallet className="h-5 w-5 text-primary" />}
      />

      <main className="p-6 space-y-8">
        {/* Summary Cards */}
        <AccountSummary accounts={accounts} />

        {/* Accounts Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              My Accounts
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64 bg-primary/5 border-primary/20 focus:border-primary"
                />
              </div>

              {/* Type Filter */}
              <Select
                value={amountType === "all" ? "all" : String(amountType)}
                onValueChange={(v) =>
                  setAmountType(v === "all" ? "all" : (Number(v) as AmountType))
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={String(AmountType.CheckingAccount)}>
                    CheckingAccount
                  </SelectItem>
                  <SelectItem value={String(AmountType.Cash)}>Cash</SelectItem>
                  <SelectItem value={String(AmountType.SavingsAccount)}>
                    SavingsAccount
                  </SelectItem>
                  <SelectItem value={String(AmountType.CreditCard)}>
                    CreditCard
                  </SelectItem>
                  <SelectItem value={String(AmountType.Investment)}>
                    Investment
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Add Account Button */}
              <Button onClick={handleAddAccount}>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>
          </div>

          {/* Accounts Grid */}
          {filteredAccounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={handleEditAccount}
                  onDelete={(acc) => setDeletingAccount(acc)}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No accounts found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || amountType !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by adding your first account."}
              </p>
              {!searchQuery && amountType === "all" && (
                <Button onClick={handleAddAccount}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Account
                </Button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Dialogs */}
      <AccountForm
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        account={editingAccount}
        onSave={handleSaveAccount}
        defaultType={currentType}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteAccountDialog
        open={!!deletingAccount}
        onOpenChange={(open) => !open && setDeletingAccount(null)}
        account={deletingAccount}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
