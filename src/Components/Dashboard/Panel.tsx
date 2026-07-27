import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The dashboard's card shell. Flatter and rounder than the shadcn `Card` used
 * elsewhere in the app: the dashboard sits on a warm paper background where
 * heavy borders and shadows fight the hierarchy.
 */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-2xl border border-border bg-card", className)}
      {...props}
    />
  );
}

/** The uppercase monospace label that titles every block on the dashboard. */
export function Eyebrow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

interface PanelHeaderProps {
  title: string;
  description?: React.ReactNode;
  /** Right-aligned monospace note, e.g. "€1,591 BY 10 AUG". */
  meta?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function PanelHeader({
  title,
  description,
  meta,
  action,
  className,
}: PanelHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {meta && (
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {meta}
        </span>
      )}
      {action}
    </div>
  );
}
