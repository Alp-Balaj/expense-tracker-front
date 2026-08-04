import {
  ArrowDownUp,
  CalendarClock,
  FileText,
  Home,
  PieChart,
  PiggyBank,
  Tags,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * The one description of the app's navigation. The desktop sidebar, the mobile
 * nav sheet, the mobile tab bar, the top bar's title and the command palette
 * all read from here, so a new page is added in a single place.
 */

export type NavItem = {
  label: string;
  /** Where the tab bar and the top bar are too narrow for the full label. */
  shortLabel?: string;
  to: string;
  icon: LucideIcon;
  /** Which indicator, if any, this row carries. See useNavIndicators. */
  badge?: "expenseCount" | "budgetAttention" | "plannedDue";
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Daily",
    items: [
      { label: "Home", to: "/", icon: Home },
      { label: "Expenses", to: "/expenses", icon: TrendingDown, badge: "expenseCount" },
      { label: "Income", to: "/income", icon: TrendingUp },
    ],
  },
  {
    label: "Plan",
    items: [
      { label: "Planned", to: "/planned", icon: CalendarClock, badge: "plannedDue" },
      { label: "Budgets", to: "/budgets", icon: PieChart, badge: "budgetAttention" },
      { label: "Savings", to: "/savings", icon: PiggyBank },
      // Cycle U. Under "Plan" rather than "Daily": a pot is a standing
      // arrangement you set up, not somewhere you land every time you spend.
      { label: "Pots", to: "/pots", icon: Users },
    ],
  },
  {
    label: "Review",
    items: [
      { label: "Accounts", to: "/account", icon: Wallet },
      { label: "Reports", to: "/reports", icon: FileText },
      {
        label: "Categories & Currencies",
        shortLabel: "Categories",
        to: "/categoryAndCurrency",
        icon: Tags,
      },
      {
        label: "Import & Export",
        shortLabel: "Data",
        to: "/data",
        icon: ArrowDownUp,
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** "/" only matches itself; every other route also matches its sub-paths. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
}

/**
 * Routes that are real screens but not nav destinations — you arrive at them
 * from somewhere else, so they have no row to take a title from.
 */
const OFF_NAV_TITLES: [prefix: string, title: string][] = [
  ["/join", "Join a pot"],
];

/** The title the top bar shows for the route currently on screen. */
export function pageTitle(pathname: string): string {
  const match = NAV_ITEMS.find((item) => isNavItemActive(item, pathname));
  if (match) return match.to === "/" ? "Dashboard" : (match.shortLabel ?? match.label);

  const offNav = OFF_NAV_TITLES.find(([prefix]) => pathname.startsWith(prefix));
  return offNav ? offNav[1] : "Not found";
}
