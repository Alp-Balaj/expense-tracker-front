import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import {
  Home,
  Wallet,
  TrendingUp,
  TrendingDown,
  Tags,
  PiggyBank,
  PieChart,
  Paperclip,
} from "lucide-react";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      icon: Home,
      label: "Home",
      isActive: location.pathname === "/",
      onClick: () => navigate("/"),
    },
    {
      icon: Wallet,
      label: "Accounts",
      isActive: location.pathname.startsWith("/account"),
      onClick: () => navigate("/account"),
    },
    {
      icon: TrendingDown,
      label: "Expenses",
      isActive: location.pathname.startsWith("/expenses"),
      onClick: () => navigate("/expenses"),
    },
    {
      icon: TrendingUp,
      label: "Income",
      isActive: location.pathname.startsWith("/income"),
      onClick: () => navigate("/income"),
    },
    {
      icon: Tags,
      label: "Categories & Currencies",
      isActive: location.pathname.startsWith("/categoryAndCurrency"),
      onClick: () => navigate("/categoryAndCurrency"),
    },
    {
      icon: PiggyBank,
      label: "Savings",
      isActive: location.pathname.startsWith("/savings"),
      onClick: () => navigate("/savings"),
    },
    {
      icon: PieChart,
      label: "Budgets",
      isActive: location.pathname.startsWith("/budgets"),
      onClick: () => navigate("/budgets"),
    },
    {
      icon: Paperclip,
      label: "Reports",
      isActive: location.pathname.startsWith("/reports"),
      onClick: () => navigate("/reports"),
    },
  ];

  return (
    <div className="flex min-h-screen w-screen overflow-x-hidden">
      <AppSidebar menuItems={menuItems} />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}