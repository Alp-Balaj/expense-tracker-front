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

/** The title the top bar shows for the route currently on screen. */
export function pageTitle(pathname: string): string {
  const match = NAV_ITEMS.find((item) => isNavItemActive(item, pathname));
  if (!match) return "Not found";
  return match.to === "/" ? "Dashboard" : (match.shortLabel ?? match.label);
}
