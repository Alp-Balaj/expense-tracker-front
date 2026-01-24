import { useState } from "react";
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
import type { Account, AccountFormData, AccountType } from "@/Models/Account";

// Sample initial accounts data - in production this would come from your .NET API
const initialAccounts: Account[] = [
  {
    id: "1",
    name: "Main Checking",
    type: "checking",
    balance: 10000.0,
    currencyId: "USD",
    description: "Primary checking account for daily expenses",
  },
  {
    id: "2",
    name: "Emergency Savings",
    type: "savings",
    balance: 8000.0,
    currencyId: "USD",
    description: "Emergency fund - 6 months expenses",
  },
  {
    id: "3",
    name: "Wallet Cash",
    type: "cash",
    balance: 2000.0,
    currencyId: "USD",
    description: "Physical cash on hand",
  },
  {
    id: "4",
    name: "Investment Portfolio",
    type: "investment",
    balance: 15000.0,
    currencyId: "USD",
    description: "Stock and ETF investments",
  },
  {
    id: "5",
    name: "Credit Card",
    type: "credit",
    balance: -1500.0,
    currencyId: "USD",
    description: "Monthly credit card balance",
  },
];

export default function AccountPage() {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AccountType | "all">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  // Filter accounts based on search and type
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || account.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleAddAccount = (data: AccountFormData) => {
    const newAccount: Account = {
      id: Date.now().toString(),
      ...data,
    };
    setAccounts([...accounts, newAccount]);
  };

  const handleEditAccount = (data: AccountFormData) => {
    if (!editingAccount) return;
    setAccounts(
      accounts.map((acc) =>
        acc.id === editingAccount.id
          ? { ...acc, ...data, updatedAt: new Date().toISOString() }
          : acc
      )
    );
    setEditingAccount(null);
  };

  const handleDeleteAccount = () => {
    if (!deletingAccount) return;
    setAccounts(accounts.filter((acc) => acc.id !== deletingAccount.id));
    setDeletingAccount(null);
  };

  const handleViewDetails = (account: Account) => {
    // In production, this would navigate to a details page or open a details modal
    console.log("View details for:", account.name);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Accounts</h1>
          </div>
        </div>
      </header>

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
                value={typeFilter}
                onValueChange={(value) =>
                  setTypeFilter(value as AccountType | "all")
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>

              {/* Add Account Button */}
              <Button onClick={() => setIsAddDialogOpen(true)}>
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
                  onEdit={(acc) => setEditingAccount(acc)}
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
                {searchQuery || typeFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by adding your first account."}
              </p>
              {!searchQuery && typeFilter === "all" && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Account
                </Button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Add Account Dialog */}
      <AccountForm
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddAccount}
      />

      {/* Edit Account Dialog */}
      <AccountForm
        open={!!editingAccount}
        onOpenChange={(open) => !open && setEditingAccount(null)}
        onSubmit={handleEditAccount}
        editingAccount={editingAccount}
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
