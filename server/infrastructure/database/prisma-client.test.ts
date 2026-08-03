import { beforeEach, describe, expect, it, vi } from "vitest";

const PrismaClient = vi.hoisted(() => vi.fn(function PrismaClientMock(options: unknown) { return { options }; }));
const config = vi.hoisted(() => ({ databaseProvider: "sqlite", databaseUrl: "file:test.db", nodeEnv: "test" }));
const assertPrismaProvider = vi.hoisted(() => vi.fn());
const createPrismaAdapter = vi.hoisted(() => vi.fn(() => ({ adapterName: "mock-adapter" })));

vi.mock("@/generated/prisma/client", () => ({ PrismaClient }));
vi.mock("@/server/infrastructure/config/config", () => ({ config }));
vi.mock("./prisma-adapter-factory", () => ({ assertPrismaProvider, createPrismaAdapter }));

describe("Prisma client singleton", () => {
  beforeEach(() => {
    vi.resetModules();
    delete (globalThis as { prisma?: unknown }).prisma;
    PrismaClient.mockClear();
    assertPrismaProvider.mockClear();
    createPrismaAdapter.mockClear();
  });

  it("creates one configured client and stores it during non-production runs", async () => {
    const prismaModule = await import("./prisma-client");
    expect(prismaModule.prisma).toEqual({ options: { adapter: { adapterName: "mock-adapter" } } });
    expect(assertPrismaProvider).toHaveBeenCalledWith("sqlite");
    expect(createPrismaAdapter).toHaveBeenCalledWith("sqlite", "file:test.db");
    expect(PrismaClient).toHaveBeenCalledWith({ adapter: { adapterName: "mock-adapter" } });
    expect((globalThis as { prisma?: unknown }).prisma).toBe(prismaModule.prisma);
  });
});
