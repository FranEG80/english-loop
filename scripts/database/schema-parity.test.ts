import { describe, expect, it } from "vitest";
import { modelFieldSignature, renderProviderSchema } from "./schema-parity";

const source = `datasource db { provider = "sqlite" }\nmodel Note {\n id String @id\n prompt String\n}`;

describe("provider schema rendering", () => {
  it("keeps the same model and field contract for each provider", () => {
    const canonical = modelFieldSignature(renderProviderSchema(source, "sqlite"));
    for (const provider of ["d1", "postgresql", "mariadb"] as const) {
      expect(modelFieldSignature(renderProviderSchema(source, provider))).toEqual(canonical);
    }
  });

  it("uses long text columns for MariaDB content fields", () => {
    expect(renderProviderSchema(source, "mariadb")).toContain("prompt String @db.LongText");
    expect(renderProviderSchema(source, "postgresql")).not.toContain("@db.LongText");
  });
});
