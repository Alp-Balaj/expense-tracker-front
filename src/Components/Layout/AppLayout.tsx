import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import {
  Receipt,
  Wallet,
  TrendingUp,
  Tags,
  PiggyBank,
  Paperclip,
} from "lucide-react";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      icon: Receipt,
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
      icon: TrendingUp,
      label: "Income",
      onClick: () => navigate("/income"),
    },
    {
      icon: Tags,
      label: "Categories & Currencies",
      onClick: () => navigate("/categoryAndCurrency"),
    },
    {
      icon: PiggyBank,
      label: "Savings",
      onClick: () => navigate("/savings"),
    },
    {
      icon: Paperclip,
      label: "Reports",
      onClick: () => navigate("/reports"),
    },
  ];

  return (
    <div className="flex min-h-screen w-screen overflow-x-hidden">
      <AppSidebar menuItems={menuItems} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}