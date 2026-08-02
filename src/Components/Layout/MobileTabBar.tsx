import { useLocation, useNavigate } from "react-router-dom";
import { Home, Menu, PieChart, Plus, ReceiptText, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** The routes each tab stands for; "More" covers everything not listed here. */
const TABS: { label: string; icon: LucideIcon; to: string; covers: string[] }[] = [
  { label: "Home", icon: Home, to: "/", covers: ["/"] },
  { label: "Spend", icon: ReceiptText, to: "/expenses", covers: ["/expenses"] },
  { label: "Plan", icon: PieChart, to: "/budgets", covers: ["/budgets", "/savings"] },
];

function covered(pathname: string, routes: string[]): boolean {
  return routes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route),
  );
}

/**
 * The phone's primary navigation: three destinations, the log button that the
 * whole app is built around, and a "More" tab for the rest.
 */
export function MobileTabBar({ onOpenNav }: { onOpenNav: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const everything = TABS.flatMap((tab) => tab.covers);
  const moreIsActive = !covered(pathname, everything);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex min-h-[74px] items-stretch border-t border-border bg-card md:hidden"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <Tab
        {...TABS[0]}
        isActive={covered(pathname, TABS[0].covers)}
        onClick={() => navigate(TABS[0].to)}
      />
      <Tab
        {...TABS[1]}
        isActive={covered(pathname, TABS[1].covers)}
        onClick={() => navigate(TABS[1].to)}
      />

      <div className="flex w-[76px] shrink-0 items-center justify-center">
        <button
          type="button"
          // The quick-add screen, not the modal: /add prefills category,
          // account and date from history, tuned for one-handed phone entry.
          onClick={() => navigate("/add")}
          aria-label="Log expense"
          className="-mt-4 flex size-14 items-center justify-center rounded-[18px] border-2 border-card bg-primary text-primary-foreground shadow-[0_6px_16px_-4px_color-mix(in_srgb,var(--primary)_55%,transparent)]"
        >
          <Plus className="size-[22px]" />
        </button>
      </div>

      <Tab
        {...TABS[2]}
        isActive={covered(pathname, TABS[2].covers)}
        onClick={() => navigate(TABS[2].to)}
      />
      <Tab label="More" icon={Menu} isActive={moreIsActive} onClick={onOpenNav} />
    </nav>
  );
}

function Tab({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1",
        isActive
          ? "text-primary shadow-[inset_0_-3px_0_var(--primary)]"
          : "text-muted-foreground",
      )}
    >
      <Icon className="size-[22px]" />
      <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.06em]">
        {label}
      </span>
    </button>
  );
}
