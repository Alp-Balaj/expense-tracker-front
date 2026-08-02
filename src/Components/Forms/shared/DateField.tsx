import * as React from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/Components/ui/calendar";
import { Label } from "@/Components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import { todayISO, toISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export interface DateFieldProps {
  label?: string;
  /** "yyyy-MM-dd", or "" when optional and unset. */
  value: string;
  onChange: (value: string) => void;
  /** Adds a clear chip and allows the empty value. */
  optional?: boolean;
  clearLabel?: string;
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toISODate(d);
}

const chipClass = (selected: boolean) =>
  cn(
    "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
    selected
      ? "border-primary bg-primary/15 font-medium text-primary"
      : "border-border text-foreground/80 hover:bg-accent hover:text-foreground"
  );

/**
 * Date entry tuned for logging: Today / Yesterday cover most real entries in
 * one tap; anything else opens the calendar. Values stay plain "yyyy-MM-dd"
 * strings per the app-wide date convention.
 */
export function DateField({
  label = "Date",
  value,
  onChange,
  optional,
  clearLabel = "None",
}: DateFieldProps) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const today = todayISO();
  const yesterday = yesterdayISO();
  const isOther = value !== "" && value !== today && value !== yesterday;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-muted-foreground">
            (optional)
          </span>
        )}
      </Label>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {optional && (
          <button
            type="button"
            role="radio"
            aria-checked={value === ""}
            onClick={() => onChange("")}
            className={chipClass(value === "")}
          >
            {clearLabel}
          </button>
        )}
        <button
          type="button"
          role="radio"
          aria-checked={value === today}
          onClick={() => onChange(today)}
          className={chipClass(value === today)}
        >
          Today
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === yesterday}
          onClick={() => onChange(yesterday)}
          className={chipClass(value === yesterday)}
        >
          Yesterday
        </button>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              role="radio"
              aria-checked={isOther}
              className={chipClass(isOther)}
            >
              <CalendarIcon className="size-3.5" />
              {isOther ? format(parseISO(value), "MMM d, yyyy") : "Pick a date…"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value ? parseISO(value) : undefined}
              defaultMonth={value ? parseISO(value) : undefined}
              onSelect={(d) => {
                if (d) onChange(toISODate(d));
                setPickerOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
