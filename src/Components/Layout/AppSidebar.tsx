import { Link, useLocation } from "react-router-dom";

import { Sidebar, useSidebar } from "@/Components/ui/sidebar";
import { useCurrency } from "@/Hooks/useCurrency";
import { currencySymbol } from "@/lib/identity";
import { NAV_GROUPS } from "./navigation";
import { NavGroups } from "./NavRow";
import { NavBudgetBlock } from "./NavBudgetBlock";
import { NavUserFooter } from "./NavUserFooter";
import type { NavIndicators } from "./useNavIndicators";

export type AppSidebarProps = {
  indicators: NavIndicators;
  appName?: string;
  appSubtitle?: string;
};

/**
 * The desktop rail: brand, the month's safe-to-spend figure, the grouped
 * routes, and who is signed in. Phones get the tab bar and the nav sheet
 * instead, so this renders nothing below `md`.
 */
export function AppSidebar({
  indicators,
  appName = "Finance Tracker",
  appSubtitle = "Expense Manager",
}: AppSidebarProps) {
  const { pathname } = useLocation();
  const { isMobile } = useSidebar();
  const { userCurrencyCode } = useCurrency();

  if (isMobile) return null;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <Link
        to="/"
        className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-5"
      >
        <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-primary text-[17px] font-extrabold text-primary-foreground">
          {currencySymbol(userCurrencyCode)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold tracking-[-0.01em] text-sidebar-foreground">
            {appName}
          </div>
          <div className="truncate font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
            {appSubtitle}
          </div>
        </div>
      </Link>

      <NavBudgetBlock indicators={indicators} />

      <nav className="min-h-0 flex-1 overflow-y-auto py-1">
        <NavGroups
          groups={NAV_GROUPS}
          pathname={pathname}
          size="rail"
          indicators={indicators}
        />
      </nav>

      <NavUserFooter className="shrink-0 border-t border-sidebar-border px-5 py-3.5" />
    </Sidebar>
  );
}
