import { Wallet } from "lucide-react";
import { SidebarTrigger } from "@/Components/ui/sidebar";
import { ModeToggle } from "@/Components/General/ModeToggle";
import React from "react";

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
}

export function PageHeader({
  title,
  icon = <Wallet className="h-5 w-5 text-primary" />,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-foreground" />
          <div className="flex items-center gap-2">
            {icon}
            <h1 className="text-xl font-semibold text-foreground">
              {title}
            </h1>
          </div>
        </div>

        {/* Right side */}
        <ModeToggle />
      </div>
    </header>
  );
}
