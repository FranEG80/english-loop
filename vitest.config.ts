import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["core/**/*.ts", "adapters/**/*.ts", "server/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "generated/**", "**/index.ts"],
      thresholds: {
        // Ratchet inicial: evita regresiones mientras se completa la
        // cobertura por capas. Estos valores se elevan por fases en CI.
        lines: 49,
        functions: 48,
        statements: 49,
        branches: 43,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "test/server-only-stub.ts"),
    },
  },
});
