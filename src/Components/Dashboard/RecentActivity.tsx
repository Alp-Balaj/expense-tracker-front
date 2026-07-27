import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { parseISO } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Panel, PanelHeader } from "@/Components/Dashboard/Panel";
import { Button } from "@/Components/ui/button";
import type { Expense } from "@/Models/Expense";
import type { Income } from "@/Models/Income";
import type { Account } from "@/Models/Account";
import type { Category } from "@/Models/Category";
import { useCurrency } from "@/Hooks/useCurrency";
import { toISODate } from "@/lib/dates";

type UnifiedEntry = {
  id: string;
  type: "expense" | "income";
  title: string;
  amount: number;
  date: string;
  accountName: string;
  categoryName: string;
};

interface RecentActivityProps {
  expenses: Expense[];
  incomes: Income[];
  accounts: Account[];
  categories: Category[];
  isLoading: boolean;
}

/** How many rows survive on a phone; the rest are desktop-only. */
const MOBILE_ROWS = 5;
const DESKTOP_ROWS = 12;

function shortDate(date: string) {
  return parseISO(toISODate(date))
    .toLocaleDateString(undefined, { day: "2-digit", month: "short" })
    .replace(".", "");
}

/**
 * The ledger: one dense line per transaction, money out in ink and money in
 * in the brand teal. No icons — the amount column carries the meaning.
 */
export function RecentActivity({
  expenses,
  incomes,
  accounts,
  categories,
  isLoading,
}: RecentActivityProps) {
  const navigate = useNavigate();
  const { format, userCurrencyCode } = useCurrency();

  const accountMap = useMemo(() => {
    const m = new Map<string, string>();
    accounts.forEach((a) => m.set(a.id, a.name));
    return m;
  }, [accounts]);

  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const entries = useMemo(() => {
    const unified: UnifiedEntry[] = [];

    const push = (type: "expense" | "income", items: (Expense | Income)[]) => {
      items.forEach((item) => {
        if (!item.id) return;
        unified.push({
          id: item.id,
          type,
          title: item.title,
          amount: item.amount,
          date: item.date,
          accountName: accountMap.get(item.accountId) ?? "Unknown",
          categoryName: categoryMap.get(item.categoryId) ?? "Uncategorized",
        });
      });
    };

    push("expense", expenses);
    push("income", incomes);

    // "yyyy-MM-dd" strings sort chronologically as plain strings.
    unified.sort((a, b) => b.date.localeCompare(a.date));
    return unified.slice(0, DESKTOP_ROWS);
  }, [expenses, incomes, accountMap, categoryMap]);

  const skeletonItems = ["a", "b", "c", "d", "e"];

  if (isLoading) {
    return (
      <Panel className="animate-pulse p-5 lg:px-6">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {skeletonItems.map((id) => (
            <div key={id} className="flex items-center gap-3">
              <div className="h-3 w-11 rounded bg-muted" />
              <div className="h-3 flex-1 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="p-5 lg:px-6">
      <PanelHeader
        title="Recent"
        description="Your latest transactions across all accounts"
        action={
          <Button
            variant="ghost"
            size="sm"
            className="-mr-2 h-auto shrink-0 gap-1 px-2 py-1 text-xs font-semibold text-primary"
            onClick={() => navigate("/expenses")}
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        }
      />

      {entries.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nothing logged yet. Add your first expense to start the ledger.
        </p>
      ) : (
        <ul className="mt-3">
          {entries.map((entry, index) => {
            const isIncome = entry.type === "income";
            return (
              <li
                key={`${entry.type}-${entry.id}`}
                data-testid="ledger-row"
                className={`items-center gap-3 border-t border-border py-2.5 ${
                  index >= MOBILE_ROWS ? "hidden lg:flex" : "flex"
                }`}
              >
                <span className="w-11 shrink-0 font-mono text-[11px] uppercase text-muted-foreground">
                  {shortDate(entry.date)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-foreground">
                  {entry.title}
                </span>
                <span className="hidden w-52 shrink-0 truncate text-xs text-muted-foreground lg:block">
                  {entry.accountName} · {entry.categoryName}
                </span>
                <span
                  className={`w-24 shrink-0 text-right text-[13.5px] font-semibold tabular-nums lg:w-28 ${
                    isIncome ? "text-secondary" : "text-foreground"
                  }`}
                >
                  {isIncome ? "+" : "−"}
                  {format(entry.amount, userCurrencyCode)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
