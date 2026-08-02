import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/Components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { useIsMobile } from "@/Hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface FormShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  submitDisabled?: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  /** Width class for the desktop dialog, e.g. "sm:max-w-[550px]". */
  desktopClassName?: string;
  children: React.ReactNode;
}

/**
 * Responsive container for every add/edit form: a full-screen takeover on
 * phones (top bar with ✕, scrollable body, sticky bottom submit inside thumb
 * reach) and the familiar centered dialog on md+ screens. Owns the <form> so
 * Enter submits in both variants.
 */
export function FormShell({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  submitDisabled,
  onSubmit,
  onCancel,
  desktopClassName,
  children,
}: FormShellProps) {
  const isMobile = useIsMobile();

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            // Undo the centered-dialog positioning: cover the viewport.
            "top-0 left-0 h-dvh max-w-none translate-x-0 translate-y-0",
            "gap-0 rounded-none border-0 p-0",
            // minmax(0,1fr) column: without it, nowrap header text sets the
            // track's min-content width and the whole form overflows the phone.
            "grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto]",
            "data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4"
          )}
        >
          <DialogHeader className="flex-row items-center gap-1 border-b border-border px-2 py-2 text-left sm:text-left">
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={onCancel}
              >
                <X className="size-5" />
              </Button>
            </DialogClose>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base">{title}</DialogTitle>
              {description ? (
                <DialogDescription className="truncate text-xs">
                  {description}
                </DialogDescription>
              ) : null}
            </div>
          </DialogHeader>

          <form
            onSubmit={onSubmit}
            className="grid min-h-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto]"
          >
            <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
              {children}
            </div>
            <div className="border-t border-border bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <Button
                type="submit"
                disabled={submitDisabled}
                className="h-12 w-full text-base"
              >
                {submitLabel}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={desktopClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          {children}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
