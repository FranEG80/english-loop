import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Reglas de dependencia de la arquitectura hexagonal ligera del frontend
  // (ver DOC/ARCHITECTURE.md). `core/` no puede depender de React, Next.js ni de
  // los adapters/features/app; los adapters mock y REST no deben importarse
  // entre sí.
  {
    files: ["core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "next", "next/*"],
              message: "core/ no puede depender de React ni de Next.js.",
            },
            {
              group: ["@/adapters/*", "@/features/*", "@/app/*"],
              message:
                "core/ no puede depender de adapters, features ni app.",
            },
            {
              group: ["@prisma/*", "better-auth", "zod"],
              message:
                "core/ no puede depender de Prisma, Better Auth ni Zod.",
            },
          ],
        },
      ],
    },
  },
  {
    // El shared kernel es el nivel más bajo: no puede depender de ningún
    // bounded context ni de la capa de aplicación.
    files: ["core/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/core/(?!shared)"],
              message:
                "core/shared no puede depender de otros bounded contexts.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["adapters/mock/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/adapters/rest/*"],
              message: "El adapter mock no debe importar el adapter REST.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["adapters/rest/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/adapters/mock/*"],
              message: "El adapter REST no debe importar el adapter mock.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
