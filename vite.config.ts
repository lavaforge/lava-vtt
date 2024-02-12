import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    manifest: true,
    rollupOptions: {
      input: "./src/main.ts",
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
