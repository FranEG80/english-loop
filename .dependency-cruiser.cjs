/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "core-no-framework",
      comment: "core/ no puede depender de React, Next.js, Prisma, Better Auth ni Zod.",
      from: { path: "^core/" },
      to: {
        path: "^(react|react-dom|next|next/.*|@prisma/.*|better-auth|zod)$",
      },
    },
    {
      name: "core-no-outer-layers",
      comment: "core/ no puede depender de adapters, features ni app.",
      from: { path: "^core/" },
      to: { path: "^(adapters/|features/|app/)" },
    },
    {
      name: "shared-no-bounded-context",
      comment: "core/shared no puede depender de otros bounded contexts.",
      from: { path: "^core/shared/" },
      to: { path: "^core/(?!shared)" },
    },
    {
      name: "adapters-no-mock-rest-cross",
      comment: "Los adapters mock y REST no deben importarse entre sí.",
      from: { path: "^adapters/mock/" },
      to: { path: "^adapters/rest/" },
    },
    {
      name: "adapters-rest-no-mock",
      comment: "El adapter REST no debe importar el adapter mock.",
      from: { path: "^adapters/rest/" },
      to: { path: "^adapters/mock/" },
    },
    {
      name: "features-no-concrete-adapters",
      comment: "features/ no puede importar adapters mock ni REST directamente.",
      from: { path: "^features/", pathNot: "\\.test\\." },
      to: { path: "^adapters/(mock|rest)/" },
    },
    {
      name: "shared-ui-no-features",
      comment: "shared/ no puede depender de features.",
      from: { path: "^shared/" },
      to: { path: "^features/" },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
      dependencyTypes: ["npm"],
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
