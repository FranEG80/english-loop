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
      include: [
        "core/**/*.ts",
        "adapters/**/*.ts",
        "server/**/*.ts",
        "app/api/**/*.ts",
        "app/actions/**/*.ts",
        "features/**/*.ts",
        "features/**/*.tsx",
        "shared/**/*.ts",
        "shared/**/*.tsx",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "generated/**",
        "**/index.ts",
        // Contracts erased by TypeScript have no runtime functions or classes.
        "core/**/ports/**",
        // Declarative type-only modules have no runtime behavior to exercise.
        "**/types/**",
        "**/type.ts",
        "**/*.type.ts",
      ],
      thresholds: {
        // Baseline global del backend y frontend ejecutable. Los módulos
        // declarativos están excluidos arriba y no reducen este baseline.
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 90,
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
