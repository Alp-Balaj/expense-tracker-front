import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/Authorization/AuthContext";
import { useAuthenticationApi } from "@/Hooks/useAuthenticationApi";
import { UserSettingsModal } from "@/Components/UserPreferences/UserSettingsModal";
import { initials } from "@/lib/identity";
import { cn } from "@/lib/utils";

interface NavUserFooterProps {
  /** Shown under the name — the account's tier. */
  planName?: string;
  className?: string;
}

/** Who is signed in, with the two things you do about it: settings and sign out. */
export function NavUserFooter({ planName = "Free plan", className }: NavUserFooterProps) {
  const { username } = useAuth();
  const { logout } = useAuthenticationApi();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {initials(username)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold text-sidebar-foreground">
          {username || "User"}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
          {planName}
        </div>
      </div>

      <UserSettingsModal triggerClassName="size-8 text-muted-foreground hover:text-foreground" />

      <button
        type="button"
        onClick={handleLogout}
        aria-label="Sign out"
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
