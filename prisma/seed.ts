import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

/**
 * Fixtures de desarrollo no destructivos. No crea usuarios ni contraseñas:
 * las cuentas deben nacer a través de Better Auth o un bootstrap autorizado.
 * Tampoco importa contenido curricular del DATASET.
 */
async function main(): Promise<void> {
  const { PrismaClient } = await import("../generated/prisma/client");
  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL ?? "file:./dev.db",
    }),
  });
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      await prisma.userSettings.upsert({
        where: { userId: user.id },
        create: { userId: user.id, activeLevels: JSON.stringify(["B1"]) },
        update: {},
      });
    }
    console.log(`Seed completado: ${users.length} usuario(s) existente(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
