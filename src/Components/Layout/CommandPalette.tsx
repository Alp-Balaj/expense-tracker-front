import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search, TrendingDown, TrendingUp } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/Components/ui/dialog";
import { useExpensesQuery } from "@/Hooks/queries/useExpenses";
import { useIncomesQuery } from "@/Hooks/queries/useIncomes";
import { useCurrency } from "@/Hooks/useCurrency";
import { toISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavItem } from "./navigation";

type Result =
  | { kind: "page"; id: string; item: NavItem }
  | {
      kind: "transaction";
      id: string;
      title: string;
      amount: number;
      date: string;
      direction: "out" | "in";
      to: string;
    };

/** How many of each kind of transaction the list shows before it stops. */
const TRANSACTION_LIMIT = 5;

/**
 * ⌘K. Jumps to a page or finds a transaction by name — the two things the top
 * bar's search field promises.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Radix unmounts the content when closed, so the field and the
          highlighted row start fresh on every opening. */}
      <Palette onClose={() => onOpenChange(false)} />
    </Dialog>
  );
}

function Palette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { format, userCurrencyCode } = useCurrency();
  const { data: expenses = [] } = useExpensesQuery();
  const { data: incomes = [] } = useIncomesQuery();

  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo<Result[]>(() => {
    const needle = query.trim().toLowerCase();

    const pages: Result[] = NAV_ITEMS.filter(
      (item) => needle === "" || item.label.toLowerCase().includes(needle),
    ).map((item) => ({ kind: "page", id: `page-${item.to}`, item }));

    if (needle === "") return pages;

    const matches = (title: string, description: string) =>
      title.toLowerCase().includes(needle) || description.toLowerCase().includes(needle);

    const byDateDesc = <T extends { date: string }>(a: T, b: T) =>
      toISODate(b.date).localeCompare(toISODate(a.date));

    const spent: Result[] = expenses
      .filter((e) => matches(e.title ?? "", e.description ?? ""))
      .sort(byDateDesc)
      .slice(0, TRANSACTION_LIMIT)
      .map((e) => ({
        kind: "transaction",
        id: `expense-${e.id}`,
        title: e.title,
        amount: e.amount,
        date: e.date,
        direction: "out",
        to: "/expenses",
      }));

    const earned: Result[] = incomes
      .filter((i) => matches(i.title ?? "", i.description ?? ""))
      .sort(byDateDesc)
      .slice(0, TRANSACTION_LIMIT)
      .map((i) => ({
        kind: "transaction",
        id: `income-${i.id}`,
        title: i.title,
        amount: i.amount,
        date: i.date,
        direction: "in",
        to: "/income",
      }));

    return [...pages, ...spent, ...earned];
  }, [query, expenses, incomes]);

  // A shorter list can leave the cursor past the end.
  const active = Math.min(cursor, Math.max(0, results.length - 1));

  const run = (result: Result | undefined) => {
    if (!result) return;
    navigate(result.kind === "page" ? result.item.to : result.to);
    onClose();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => Math.min(results.length - 1, c + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(results[active]);
    }
  };

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const firstTransaction = results.findIndex((r) => r.kind === "transaction");

  return (
    <DialogContent
      showCloseButton={false}
      className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
      onKeyDown={onKeyDown}
    >
      <DialogTitle className="sr-only">Search</DialogTitle>
      <DialogDescription className="sr-only">
        Search your transactions or jump to a page.
      </DialogDescription>

      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setCursor(0);
          }}
          placeholder="Search transactions, jump to a page…"
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="shrink-0 rounded-[5px] bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.06em] text-muted-foreground">
          ESC
        </kbd>
      </div>

      <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
        {results.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nothing matches “{query.trim()}”.
          </p>
        )}

        {results[0]?.kind === "page" && (
          <div className="px-3 pt-1 pb-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Pages
          </div>
        )}

        {results.map((result, index) => (
          <div key={result.id}>
            {index === firstTransaction && (
              <div
                className={cn(
                  "px-3 pt-1 pb-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground",
                  firstTransaction > 0 && "mt-2 border-t border-border pt-3",
                )}
              >
                Transactions
              </div>
            )}

            <button
              type="button"
              data-active={index === active}
              onMouseEnter={() => setCursor(index)}
              onClick={() => run(result)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-sm transition-colors",
                index === active ? "bg-primary-soft text-primary" : "text-foreground",
              )}
            >
              {result.kind === "page" ? (
                <>
                  <result.item.icon className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{result.item.label}</span>
                </>
              ) : (
                <>
                  {result.direction === "out" ? (
                    <TrendingDown className="size-4 shrink-0" />
                  ) : (
                    <TrendingUp className="size-4 shrink-0" />
                  )}
                  <span className="flex-1 truncate">{result.title}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {toISODate(result.date)}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums">
                    {result.direction === "out" ? "−" : "+"}
                    {format(result.amount, userCurrencyCode)}
                  </span>
                </>
              )}
              {index === active && (
                <CornerDownLeft className="size-3.5 shrink-0 opacity-60" />
              )}
            </button>
          </div>
        ))}
      </div>
    </DialogContent>
  );
}
