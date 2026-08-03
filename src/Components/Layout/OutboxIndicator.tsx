import { CloudOff, RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { useOutbox } from "@/Hooks/useOutbox";
import { cn } from "@/lib/utils";

/**
 * "Two expenses are waiting to sync."
 *
 * The affordance that makes an offline queue honest. Without it the app looks
 * identical whether a write reached the server or is sitting in IndexedDB on a
 * phone in a basement — and the whole reason to queue rather than fail is that
 * the person can stop thinking about it, which they can only do if they can see
 * that the app is still holding it.
 *
 * Renders nothing when the queue is empty, which is almost always.
 */
export function OutboxIndicator({ className }: { className?: string }) {
  const { pendingCount, stuck, isFlushing, flush } = useOutbox();

  if (pendingCount === 0 && stuck.length === 0) return null;

  const failed = stuck.length > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs",
        failed ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground",
        className
      )}
      role="status"
    >
      {failed ? (
        <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <CloudOff className="h-3.5 w-3.5 shrink-0" />
      )}

      <span>
        {failed
          ? `${stuck.length} couldn't be saved`
          : `${pendingCount} waiting to sync`}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        aria-label="Retry syncing"
        disabled={isFlushing}
        onClick={() => void flush()}
      >
        <RefreshCw className={cn("h-3.5 w-3.5", isFlushing && "animate-spin")} />
      </Button>
    </div>
  );
}
