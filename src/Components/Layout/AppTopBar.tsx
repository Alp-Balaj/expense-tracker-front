import { Link, useLocation } from "react-router-dom";
import { PanelLeft, Search } from "lucide-react";

import { useSidebar } from "@/Components/ui/sidebar";
import { ModeToggle } from "@/Components/General/ModeToggle";
import { useAuth } from "@/Authorization/AuthContext";
import { useCurrency } from "@/Hooks/useCurrency";
import { currencySymbol, initials } from "@/lib/identity";
import { pageTitle } from "./navigation";
import { NotificationsMenu } from "./NotificationsMenu";
import { OutboxIndicator } from "./OutboxIndicator";
import type { NavIndicators } from "./useNavIndicators";

/** The square icon button the top bar uses on both sides of the search field. */
const ICON_BUTTON =
  "flex size-9 items-center justify-center rounded-[10px] bg-muted text-foreground transition-colors hover:bg-border";

interface AppTopBarProps {
  indicators: NavIndicators;
  onOpenSearch: () => void;
  /** Phones have no rail to collapse — the avatar opens the nav sheet instead. */
  onOpenNav: () => void;
}

export function AppTopBar({ indicators, onOpenSearch, onOpenNav }: AppTopBarProps) {
  const { pathname } = useLocation();
  const { toggleSidebar } = useSidebar();
  const { username } = useAuth();
  const { userCurrencyCode } = useCurrency();

  const title = pageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-card">
      {/* ── Desktop ─────────────────────────────────────────────── */}
      <div className="hidden h-16 items-center gap-4 px-6 md:flex">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className={`${ICON_BUTTON} -ml-1.5`}
        >
          <PanelLeft className="size-4" />
        </button>

        <h1 className="shrink-0 text-[19px] font-bold tracking-[-0.015em] text-foreground">
          {title}
        </h1>

        <div className="h-[26px] w-px shrink-0 bg-border" />

        <button
          type="button"
          onClick={onOpenSearch}
          className="flex h-9 min-w-0 max-w-[420px] flex-1 items-center gap-2.5 rounded-[10px] bg-muted px-3 text-[13px] text-muted-foreground transition-colors hover:bg-border"
        >
          <Search className="size-4 shrink-0" />
          <span className="truncate">Search transactions, jump to a page…</span>
          <kbd className="ml-auto shrink-0 rounded-[5px] bg-card px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.06em]">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          {/* Stream O: renders nothing unless something is actually queued. */}
          <OutboxIndicator />
          <NotificationsMenu indicators={indicators} />
          <ModeToggle className={ICON_BUTTON} />
        </div>
      </div>

      {/* ── Mobile ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 md:hidden">
        <Link
          to="/"
          aria-label="Dashboard"
          className="flex size-7 shrink-0 items-center justify-center rounded-[10px] bg-primary text-[15px] font-extrabold text-primary-foreground"
        >
          {currencySymbol(userCurrencyCode)}
        </Link>

        <h1 className="min-w-0 flex-1 truncate text-base font-bold tracking-[-0.015em] text-foreground">
          {title}
        </h1>

        <div className="flex shrink-0 items-center gap-3.5 text-muted-foreground">
          <OutboxIndicator />
          <button type="button" onClick={onOpenSearch} aria-label="Search">
            <Search className="size-5" />
          </button>

          <NotificationsMenu indicators={indicators} variant="bare" />

          <button
            type="button"
            onClick={onOpenNav}
            aria-label="Account and navigation"
            className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
          >
            {initials(username)}
          </button>
        </div>
      </div>
    </header>
  );
}
