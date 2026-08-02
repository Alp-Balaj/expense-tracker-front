import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";

import path from "path"
import tailwindcss from "@tailwindcss/vite"

// --primary from index.css (oklch(0.6716 0.1368 48.513)) as sRGB hex — the
// brand color the installed app chrome and the placeholder icons use.
const BRAND_COLOR = "#d87943";

export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["vite.svg"],
        manifest: {
          name: "ExpenseTracker",
          short_name: "ExpenseTracker",
          description: "Track expenses, budgets and savings.",
          start_url: "/",
          scope: "/",
          display: "standalone",
          theme_color: BRAND_COLOR,
          background_color: "#ffffff",
          icons: [
            { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/pwa-maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
            { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
          // Long-press-the-icon launcher shortcut straight into quick add.
          shortcuts: [
            {
              name: "Add expense",
              short_name: "Add",
              description: "Log a new expense",
              url: "/add",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
            },
          ],
        },
        // App-shell PRECACHE ONLY. Deliberately no runtimeCaching and no
        // background sync: offline behavior of API calls is owned elsewhere.
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
          // Never let SPA navigation fallback swallow API-ish paths.
          navigateFallbackDenylist: [/^\/api\//],
          // Stream P: push + notificationclick handlers, pulled into the
          // generated worker instead of replacing it with a custom one. That
          // keeps Stream A's precache contract exactly as verified, and leaves
          // Stream O free to extend the same generated worker for background
          // sync without inheriting this file.
          importScripts: ["/push-sw.js"],
        },
      }),
    ],
    build: {
      outDir: "build",
    },
    server: isDev
      ? {
          port: 6969,
          strictPort: true,
          https: {
            key: fs.readFileSync("localhost+2-key.pem"),
            cert: fs.readFileSync("localhost+2.pem"),
          },
        }
      : undefined,
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
      "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});