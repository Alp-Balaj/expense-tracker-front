import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { SidebarTrigger } from "@/Components/ui/sidebar";
import { ModeToggle } from "@/Components/General/ModeToggle";

interface DashboardTopBarProps {
  /**
   * The hero figure, condensed. It takes over from the page title once the
   * hero itself has scrolled away, so the number is never off screen.
   */
  readout?: { amount: string; caption: string } | null;
}

/** How far the page scrolls before the hero is considered gone. */
const CONDENSE_AT = 110;

export function DashboardTopBar({ readout }: DashboardTopBarProps) {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > CONDENSE_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showReadout = condensed && Boolean(readout);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <SidebarTrigger className="text-foreground" />
          <div
            className={`flex min-w-0 items-center gap-2 ${showReadout ? "hidden sm:flex" : "flex"}`}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0 text-primary" />
            <h1 className="truncate text-xl font-semibold text-foreground">Dashboard</h1>
          </div>
        </div>

        {showReadout && readout && (
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="truncate text-[15px] font-semibold tabular-nums text-foreground">
              {readout.amount}
            </span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {readout.caption}
            </span>
          </div>
        )}

        <ModeToggle />
      </div>
    </header>
  );
}
