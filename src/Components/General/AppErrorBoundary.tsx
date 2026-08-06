import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/Components/ui/button";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

/**
 * The last line between an uncaught render error and a blank white page.
 *
 * Two error classes end up here: a component throwing during render, and a
 * lazy route whose chunk no longer exists because a deploy rotated the hashed
 * asset names out from under a tab holding the previous index.html. Both used
 * to unmount the entire tree and leave nothing on screen. A hard reload fixes
 * the second class outright (fresh index.html, current chunk names) and is the
 * honest first move for the first.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught error reached AppErrorBoundary", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-svh w-full items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-lg font-medium text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-4">
            The page hit an unexpected error. Reloading usually fixes it.
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload page
          </Button>
        </div>
      </main>
    );
  }
}
