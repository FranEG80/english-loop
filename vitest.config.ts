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
        "core/shared/kernel/*-port.ts",
        "core/shared/kernel/domain-event.ts",
        "core/shared/kernel/message.ts",
        "core/shared/kernel/pagination.ts",
        "core/models/activity.ts",
        "core/models/attempt.ts",
        "core/models/auth.ts",
        "core/models/canvas-preview.ts",
        "core/models/daily-session.ts",
        "core/models/flashcard.ts",
        "core/models/lesson.ts",
        "core/models/practice.ts",
        "core/models/progress.ts",
        "core/models/review.ts",
        "core/models/settings.ts",
        "core/models/taxonomy.ts",
      ],
      thresholds: {
        // Umbral de la primera ola integral; se eleva junto con cada capa
        // que se incorpora al inventario de tests.
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 57,
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
