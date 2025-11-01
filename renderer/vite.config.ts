import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: "../build/renderer",
    emptyOutDir: true,
    assetsDir: "assets",
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    }
  },
});
