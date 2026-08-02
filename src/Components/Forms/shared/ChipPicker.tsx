import * as React from "react";
import { Plus } from "lucide-react";

import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";

export interface ChipItem {
  id: string;
  label: string;
  /** Renders a colored dot before the label (category colors). */
  color?: string;
  icon?: React.ReactNode;
}

export interface ChipPickerProps {
  label: string;
  items: ChipItem[];
  value: string;
  onChange: (id: string) => void;
  /** Renders a trailing "+ label" chip that jumps to the create page. */
  onAddNew?: () => void;
  addNewLabel?: string;
  /** Shown when there are no items at all. */
  emptyHint?: string;
  error?: string | null;
  optionalTag?: boolean;
}

/**
 * Single-select chips laid out inline — one tap, no dropdown layer. The
 * mobile-native replacement for the form selects; works just as well inside
 * the desktop dialogs.
 */
export function ChipPicker({
  label,
  items,
  value,
  onChange,
  onAddNew,
  addNewLabel = "New",
  emptyHint,
  error,
  optionalTag,
}: ChipPickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {optionalTag && (
          <span className="ml-1 font-normal text-muted-foreground">
            (optional)
          </span>
        )}
      </Label>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {items.length === 0 && emptyHint && (
          <p className="w-full text-sm text-muted-foreground">{emptyHint}</p>
        )}
        {items.map((item) => {
          const selected = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(selected ? "" : item.id)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
                selected
                  ? "border-primary bg-primary/15 font-medium text-primary"
                  : "border-border text-foreground/80 hover:bg-accent hover:text-foreground"
              )}
            >
              {item.color && (
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              {item.icon}
              {item.label}
            </button>
          );
        })}
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-dashed border-border px-3.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="size-3.5" />
            {addNewLabel}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
