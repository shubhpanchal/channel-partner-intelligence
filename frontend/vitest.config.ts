import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/__tests__/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "e2e/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 85,
        branches: 80,
        functions: 85,
        statements: 85,
      },
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "node_modules/",
        "next.config.mjs",
        "tailwind.config.ts",
        "postcss.config.js",
        "**/*.d.ts",
        ".next/**",
        "vitest.setup.ts",
        "playwright.config.ts",
        "e2e/**",
        "src/app/layout.tsx",
        "src/app/page.tsx",
        "src/components/ui/dialog.tsx",
        "src/components/ui/dropdown-menu.tsx",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
