import {
  SidebarInset,
  SidebarTrigger,
} from "@/Components/ui/sidebar";
import { Wallet } from "lucide-react";
import { AccountCard } from "@/Components/Accounts/AccountCard";
import { BankCard } from "@/Components/Accounts/BankCard";

const accounts = [
  {
    title: "Checking Account",
    balance: "USD 10,000.00",
    iban: "AB11 0000 0000 1111 1111",
    owner: "John Doe",
    growth: "2.36%",
    variant: "primary" as const,
  },
  {
    title: "Savings Account",
    balance: "USD 8,000.00",
    iban: "AB11 0000 0000 1111 1111",
    owner: "John Doe",
    growth: "2.36%",
    variant: "secondary" as const,
  },
  {
    title: "Budget Account",
    balance: "USD 2,000.00",
    iban: "AB11 0000 0000 1111 1111",
    owner: "John Doe",
    growth: "2.36%",
    variant: "tertiary" as const,
  },
];

const cards = [
  {
    type: "credit" as const,
    balance: "USD 10,000.00",
    cardNumber: "1111000011000000",
    expiryDate: "12/24",
    isPhysical: true,
    isActive: true,
    expiryWarning: "1 month left",
  },
  {
    type: "debit" as const,
    balance: "USD 8,500.00",
    cardNumber: "1111000011000000",
    expiryDate: "12/24",
    isPhysical: true,
    isActive: true,
    expiryWarning: "1 month left",
  },
];

export default function AccountPage() {
  return (
    <SidebarInset className="bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
          <SidebarTrigger className="text-foreground" />
          <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Accounts and Cards</h1>
          </div>
      </header>

      <main className="p-6 space-y-8">
          {/* My Accounts Section */}
          <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">My accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
              <AccountCard
                  key={account.title}
                  title={account.title}
                  balance={account.balance}
                  iban={account.iban}
                  owner={account.owner}
                  growth={account.growth}
                  variant={account.variant}
              />
              ))}
          </div>
          </section>

          {/* My Cards Section */}
          <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">My cards</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {cards.map((card, index) => (
              <BankCard
                  key={index}
                  type={card.type}
                  balance={card.balance}
                  cardNumber={card.cardNumber}
                  expiryDate={card.expiryDate}
                  isPhysical={card.isPhysical}
                  isActive={card.isActive}
                  expiryWarning={card.expiryWarning}
              />
              ))}
          </div>
          </section>
      </main>
    </SidebarInset>
  );
}