import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    fs: {
      // Erlaube Lesen aus dem Eltern-Ordner (für ../docs/)
      allow: [path.resolve(__dirname, "..")],
    },
  },
});
