import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderProviderSchema, type PrismaProvider } from "./schema-parity";

function providerFromArg(value: string | undefined): PrismaProvider {
  if (value === "sqlite" || value === "d1" || value === "postgresql" || value === "mariadb") return value;
  throw new Error("Usage: render-provider-schema.ts <sqlite|d1|postgresql|mariadb> [output]");
}

const provider = providerFromArg(process.argv[2]);
const output = process.argv[3] ?? path.join("prisma", "generated", `schema.${provider}.prisma`);
const source = await readFile(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
await writeFile(path.resolve(output), renderProviderSchema(source, provider), "utf8");
console.log(`Rendered ${provider} Prisma schema at ${path.resolve(output)}`);
