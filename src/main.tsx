import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { queryClient } from "./lib/queryClient";
import "./index.css";

// Precache-only app-shell service worker (see VitePWA config); autoUpdate
// swaps in new builds on next load without prompting.
registerSW({ immediate: true });

// A deploy rotates every hashed chunk name; a tab still running the previous
// build asks for chunks that no longer exist, and Vite surfaces the failed
// dynamic import as this event. One hard reload fetches the current index.html
// and heals it. The timestamp latch keeps a genuinely broken deploy from
// reload-looping — after one attempt per 30s window, the error propagates to
// AppErrorBoundary instead.
const RELOAD_LATCH_KEY = "et.chunkReloadAt";
window.addEventListener("vite:preloadError", (event) => {
  const lastAttempt = Number(sessionStorage.getItem(RELOAD_LATCH_KEY) ?? 0);
  if (Date.now() - lastAttempt > 30_000) {
    sessionStorage.setItem(RELOAD_LATCH_KEY, String(Date.now()));
    event.preventDefault();
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
