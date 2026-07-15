import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/Components/ui/sidebar";
import { Button } from "@/Components/ui/button";
import {
  Receipt,
  TrendingUp,
  Wallet,
  Tags,
  PiggyBank,
  HelpCircle,
  DollarSign,
  LogOut,
} from "lucide-react";
import { UserSettingsModal } from "../UserPreferences/UserSettingsModal";
import { useAuthenticationApi } from "@/Hooks/useAuthenticationApi";
import { useAuth } from "@/Authorization/AuthContext";
import { useNavigate } from "react-router-dom";

export type MenuItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
};

export type AppSidebarProps = {
  appName?: string;
  appSubtitle?: string;
  planName?: string;
  menuItems?: MenuItem[];
};

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { icon: Receipt, label: "Expenses", isActive: true },
  { icon: TrendingUp, label: "Income" },
  { icon: Wallet, label: "Accounts" },
  { icon: Tags, label: "Categories and Currencies" },
  { icon: PiggyBank, label: "Savings" },
];

export function AppSidebar({
  appName = "Finance Tracker",
  appSubtitle = "Expense Manager",
  planName = "Free Plan",
  menuItems = DEFAULT_MENU_ITEMS,
}: AppSidebarProps) {
  const { logout } = useAuthenticationApi();
  const { username } = useAuth();
  const navigate = useNavigate();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Sidebar className="border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground">
              {appName}
            </h2>
            <p className="text-xs text-muted-foreground">{appSubtitle}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-4">
            Finance
          </SidebarGroupLabel>

          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  isActive={Boolean(item.isActive)}
                  className="gap-3 px-4"
                  onClick={() => {
                    item.onClick?.();
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">{username || "User"}</p>
            <p className="text-xs text-muted-foreground">{planName}</p>
          </div>

          <div className="flex gap-1">
            <UserSettingsModal/>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">Help</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}