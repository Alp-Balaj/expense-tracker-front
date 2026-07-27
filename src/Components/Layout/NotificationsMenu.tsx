import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarClock, PieChart } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { useCurrency } from "@/Hooks/useCurrency";
import { cn } from "@/lib/utils";
import type { NavIndicators } from "./useNavIndicators";

/**
 * The bell. There is no notification feed on the backend, so the list is
 * derived from what the app already knows: bills falling due this week and
 * budgets that have crossed their warning line.
 */
export function NotificationsMenu({
  indicators,
  /** "button" is the desktop top bar's tinted square; "bare" is the phone's glyph. */
  variant = "button",
}: {
  indicators: NavIndicators;
  variant?: "button" | "bare";
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { format, userCurrencyCode } = useCurrency();

  const { alerts } = indicators;
  const urgent = alerts.some((alert) => alert.urgent);
  const bare = variant === "bare";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            alerts.length > 0 ? `Notifications (${alerts.length})` : "Notifications"
          }
          className={cn(
            "relative flex items-center justify-center",
            bare
              ? "size-5 text-muted-foreground"
              : "size-9 rounded-[10px] bg-muted text-foreground transition-colors hover:bg-border",
          )}
        >
          <Bell className={bare ? "size-5" : "size-4"} />
          {alerts.length > 0 && (
            <span
              className={cn(
                "absolute size-2 rounded-full ring-2 ring-card",
                bare ? "-top-0.5 -right-0.5" : "top-1.5 right-1.5",
                urgent ? "bg-destructive" : "bg-primary",
              )}
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Needs attention</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {alerts.length === 0 ? "All clear" : `${alerts.length} item${alerts.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {alerts.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No bills due this week and every budget is on pace.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto py-1">
            {alerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => {
                  navigate(alert.to);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-[10px]",
                    alert.urgent
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary-soft text-primary",
                  )}
                >
                  {alert.kind === "bill" ? (
                    <CalendarClock className="size-4" />
                  ) : (
                    <PieChart className="size-4" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{alert.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {alert.detail}
                  </span>
                </span>

                <span className="shrink-0 text-[13px] font-semibold tabular-nums">
                  {format(alert.amount, userCurrencyCode)}
                </span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
