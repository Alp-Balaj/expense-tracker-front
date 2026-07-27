import { Moon, Sun } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/Components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"
import { usePreferences } from "@/Authorization/UserPreferencesContext"

export function ModeToggle({ className }: { className?: string } = {}) {
  const { updatePreferences } = usePreferences()

  const chooseTheme = (theme: "light" | "dark" | "system") => {
    // updatePreferences applies the theme instantly, then persists it server-side.
    updatePreferences({ theme }).catch(() =>
      toast.error("Failed to save theme preference"),
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Callers that style the trigger themselves (the top bar) start from
            ghost, so no border or background has to be unset first. */}
        <Button
          variant={className ? "ghost" : "outline"}
          size="icon"
          className={className ?? "border-border"}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => chooseTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => chooseTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => chooseTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
