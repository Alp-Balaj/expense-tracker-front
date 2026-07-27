import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";
import { CommandPalette } from "./CommandPalette";
import { MobileNavSheet } from "./MobileNavSheet";
import { MobileTabBar } from "./MobileTabBar";
import { QuickLogProvider } from "./QuickLog";
import { useNavIndicators } from "./useNavIndicators";

/**
 * The app shell: a rail and a top bar on desktop, a top bar and a tab bar on
 * phones. Every page renders inside it, so the nav, the search field and the
 * month's safe-to-spend figure are on screen wherever you are.
 */
export default function AppLayout() {
  const indicators = useNavIndicators();
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  // ⌘K / Ctrl+K opens the command palette from anywhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <QuickLogProvider>
      <div className="flex min-h-svh w-full min-w-0">
        <AppSidebar indicators={indicators} />

        <div className="flex min-w-0 flex-1 flex-col bg-canvas">
          <AppTopBar
            indicators={indicators}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenNav={() => setNavOpen(true)}
          />

          {/* The tab bar floats over the bottom of the page on phones. */}
          <div className="min-w-0 flex-1 pb-[74px] md:pb-0">
            <Outlet />
          </div>
        </div>

        <MobileTabBar onOpenNav={() => setNavOpen(true)} />
        <MobileNavSheet
          open={navOpen}
          onOpenChange={setNavOpen}
          indicators={indicators}
        />
        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </QuickLogProvider>
  );
}
