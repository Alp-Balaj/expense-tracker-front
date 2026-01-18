import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 6969,
    strictPort: true,
    https: {
      key: fs.readFileSync("localhost+2-key.pem"),
      cert: fs.readFileSync("localhost+2.pem"),
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  }
});