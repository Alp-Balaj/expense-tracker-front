import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { isNavItemActive, type NavGroup, type NavItem } from "./navigation";
import type { NavIndicators } from "./useNavIndicators";

type Size = "rail" | "sheet";

const sizes = {
  // The 252px sidebar: 38px rows, 13.5px labels.
  rail: {
    row: "h-[38px] gap-3 px-5 text-[13.5px]",
    activeRow: "pl-[17px] pr-5",
    icon: "size-4",
    group: "px-5 pt-3.5 pb-1.5",
    divider: "mx-5",
    count: "text-[10.5px]",
  },
  // The mobile sheet, sized for thumbs: 46px rows, 15px labels.
  sheet: {
    row: "h-[46px] gap-3.5 px-[18px] text-[15px]",
    activeRow: "pl-[15px] pr-[18px]",
    icon: "size-[18px]",
    group: "px-[18px] pt-3 pb-1.5",
    divider: "mx-0",
    count: "text-xs",
  },
} satisfies Record<Size, Record<string, string>>;

interface NavRowProps {
  item: NavItem;
  pathname: string;
  size: Size;
  indicators: NavIndicators;
  onNavigate?: () => void;
}

/**
 * One navigation row. The active state is a left accent bar over a tinted
 * ground, which is what tells the two nav surfaces apart from a plain list.
 */
export function NavRow({ item, pathname, size, indicators, onNavigate }: NavRowProps) {
  const s = sizes[size];
  const isActive = isNavItemActive(item, pathname);
  const Icon = item.icon;

  const count = item.badge === "expenseCount" ? indicators.expenseCount : null;
  const showDot = item.badge === "budgetAttention" && indicators.budgetAttention;

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex items-center rounded-r-[10px] transition-colors",
        s.row,
        isActive
          ? cn(
              "border-l-[3px] border-primary bg-primary-soft font-semibold text-primary",
              s.activeRow,
            )
          : "text-sidebar-foreground hover:bg-muted",
      )}
    >
      <Icon className={cn(s.icon, "shrink-0")} />
      <span className="min-w-0 truncate">{item.label}</span>

      {count !== null && count > 0 && (
        <span
          className={cn("ml-auto pl-2 font-bold tabular-nums text-muted-foreground", s.count)}
        >
          {count}
        </span>
      )}
      {showDot && (
        <span
          className="ml-auto size-[7px] shrink-0 rounded-full bg-primary"
          aria-label="Needs attention"
        />
      )}
    </NavLink>
  );
}

interface NavGroupsProps {
  groups: NavGroup[];
  pathname: string;
  size: Size;
  indicators: NavIndicators;
  onNavigate?: () => void;
}

/** The grouped list itself — "Daily", "Plan", "Review", hairline between each. */
export function NavGroups({
  groups,
  pathname,
  size,
  indicators,
  onNavigate,
}: NavGroupsProps) {
  const s = sizes[size];

  return (
    <>
      {groups.map((group, index) => (
        <div key={group.label}>
          {index > 0 && <div className={cn("mt-2 h-px bg-border", s.divider)} />}
          <div
            className={cn(
              "font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground",
              s.group,
            )}
          >
            {group.label}
          </div>
          {group.items.map((item) => (
            <NavRow
              key={item.to}
              item={item}
              pathname={pathname}
              size={size}
              indicators={indicators}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </>
  );
}
