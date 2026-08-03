import { readFile } from "node:fs/promises";
import path from "node:path";

export type PrismaProvider = "sqlite" | "d1" | "postgresql" | "mariadb";

const providerSyntax: Record<PrismaProvider, string> = {
  sqlite: "sqlite",
  d1: "sqlite",
  postgresql: "postgresql",
  mariadb: "mysql",
};

const mariaLongTextFields = new Set([
  "instructions",
  "prompt",
  "passage",
  "explanation",
  "evaluatorData",
  "summary",
  "commonMistakes",
  "examples",
  "tags",
]);

export function renderProviderSchema(source: string, provider: PrismaProvider): string {
  let rendered = source.replace(
    /provider\s*=\s*"(?:sqlite|postgresql|mysql)"/,
    `provider = "${providerSyntax[provider]}"`,
  );
  if (provider === "mariadb") {
    rendered = rendered.replace(
      /^(\s*)([A-Za-z][A-Za-z0-9_]*)\s+(String\??)(?!\s+@db\.LongText)(.*)$/gm,
      (line, indentation: string, field: string, type: string, suffix: string) =>
        mariaLongTextFields.has(field)
          ? `${indentation}${field} ${type} @db.LongText${suffix}`
          : line,
    );
  }
  return rendered;
}

export function modelFieldSignature(source: string): Map<string, string[]> {
  const signature = new Map<string, string[]>();
  const modelPattern = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  for (const match of source.matchAll(modelPattern)) {
    const fields = match[2]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("//") && !line.startsWith("@@"))
      .map((line) => line.split(/\s+/).slice(0, 2).join(" "))
      .filter(Boolean);
    signature.set(match[1], fields);
  }
  return signature;
}

export async function checkSchemaParity(schemaPath = path.join(process.cwd(), "prisma/schema.prisma")) {
  const source = await readFile(schemaPath, "utf8");
  const canonical = modelFieldSignature(renderProviderSchema(source, "sqlite"));
  const mismatches: string[] = [];
  for (const provider of ["d1", "postgresql", "mariadb"] as const) {
    const candidate = modelFieldSignature(renderProviderSchema(source, provider));
    if (JSON.stringify([...canonical]) !== JSON.stringify([...candidate])) {
      mismatches.push(provider);
    }
  }
  if (mismatches.length > 0) {
    throw new Error(`Schema parity failed for: ${mismatches.join(", ")}`);
  }
  return { providers: ["sqlite", "d1", "postgresql", "mariadb"] as const, models: canonical.size };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkSchemaParity()
    .then(({ providers, models }) => console.log(`Schema parity OK: ${models} models across ${providers.join(", ")}.`))
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
