import { useLocation } from "react-router-dom";
import { ArrowLeftRight, PiggyBank, Plus, TrendingUp, type LucideIcon } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/Components/ui/sheet";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "./navigation";
import { NavGroups } from "./NavRow";
import { NavUserFooter } from "./NavUserFooter";
import { useQuickLog } from "./useQuickLog";
import type { NavIndicators } from "./useNavIndicators";

interface MobileNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicators: NavIndicators;
}

/**
 * What the "More" tab and the top bar's avatar open: the full route list the
 * phone has no room for, over a row of quick-log shortcuts.
 */
export function MobileNavSheet({ open, onOpenChange, indicators }: MobileNavSheetProps) {
  const { pathname } = useLocation();
  const { logExpense, logIncome, logSaving, logTransfer } = useQuickLog();

  const close = () => onOpenChange(false);
  const logThen = (open: () => void) => () => {
    close();
    open();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[88vh] gap-0 overflow-y-auto rounded-t-[22px] border-t-0 bg-card pb-3.5 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Log something, or move to another part of the app.
        </SheetDescription>

        <div className="flex justify-center pt-2.5 pb-1.5">
          <div className="h-1 w-11 rounded-full bg-foreground/35" />
        </div>

        <div className="border-b border-border px-[18px] pb-3.5">
          <div className="font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Log something
          </div>
          <div className="mt-2.5 flex gap-2">
            <QuickLogButton
              icon={Plus}
              label="Expense"
              primary
              onClick={logThen(logExpense)}
            />
            <QuickLogButton
              icon={TrendingUp}
              label="Income"
              onClick={logThen(logIncome)}
            />
            <QuickLogButton
              icon={PiggyBank}
              label="Saving"
              onClick={logThen(logSaving)}
            />
            <QuickLogButton
              icon={ArrowLeftRight}
              label="Transfer"
              onClick={logThen(logTransfer)}
            />
          </div>
        </div>

        <nav className="pt-3.5">
          <NavGroups
            groups={NAV_GROUPS}
            pathname={pathname}
            size="sheet"
            indicators={indicators}
            onNavigate={close}
          />
        </nav>

        <NavUserFooter className="mt-2.5 border-t border-border px-[18px] pt-3.5" />
      </SheetContent>
    </Sheet>
  );
}

function QuickLogButton({
  icon: Icon,
  label,
  primary = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col gap-1.5 rounded-xl px-2.5 py-3 text-left transition-colors",
        primary
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground hover:bg-border",
      )}
    >
      <Icon className="size-[18px]" />
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}
