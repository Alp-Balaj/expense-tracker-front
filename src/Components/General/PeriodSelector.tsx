import { useState } from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Calendar } from "@/Components/ui/calendar";
import { Label } from "@/Components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { formatDate, toISODate } from "@/lib/dates";
import { PERIOD_PRESETS, type Period, type PeriodPreset } from "@/lib/period";

interface PeriodSelectorProps {
  period: Period;
  onPresetChange: (preset: PeriodPreset) => void;
  onCustomRangeChange: (range: { from: string; to: string }) => void;
  className?: string;
}

/** Turns "yyyy-MM-dd" into the local Date the calendar wants, with no UTC hop. */
function toCalendarDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * The shared "which months am I looking at?" control for the expense and
 * income pages. Presets cover the common questions; the custom range is there
 * for everything else.
 */
export function PeriodSelector({
  period,
  onPresetChange,
  onCustomRangeChange,
  className,
}: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);

  const isCustom = period.preset === "custom";

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={period.preset}
          onValueChange={(value) => onPresetChange(value as PeriodPreset)}
        >
          <SelectTrigger className="w-[170px]" aria-label="Period">
            <SelectValue placeholder="This month" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isCustom && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 border-border">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {formatDate(period.from)} – {formatDate(period.to)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Calendar
                    mode="single"
                    selected={toCalendarDate(period.from)}
                    onSelect={(date) =>
                      date &&
                      onCustomRangeChange({
                        from: toISODate(date),
                        to: period.to,
                      })
                    }
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Calendar
                    mode="single"
                    selected={toCalendarDate(period.to)}
                    onSelect={(date) =>
                      date &&
                      onCustomRangeChange({
                        from: period.from,
                        to: toISODate(date),
                      })
                    }
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
