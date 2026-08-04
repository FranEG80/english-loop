import "server-only";
import { createAdapterFactory, type CleanedWhere, type CustomAdapter } from "better-auth/adapters";
import type { D1AuthModel, D1AuthQuery, D1AuthValue, D1AuthWhere } from "../persistence/d1/types/operations";
import type { D1TransportClient } from "../persistence/d1/types/transport";
import { operation } from "../persistence/d1/operations/request";

const MODEL_NAMES: Record<string, D1AuthModel> = {
  user: "user", User: "user", session: "session", Session: "session",
  account: "account", Account: "account", verification: "verification", Verification: "verification",
};

function modelName(model: string): D1AuthModel {
  const normalized = MODEL_NAMES[model];
  if (!normalized) throw new Error(`Unsupported Better Auth model: ${model}`);
  return normalized;
}

function scalar(value: unknown): D1AuthValue {
  if (value instanceof Date) return value.toISOString();
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    const normalized = value.map(scalar);
    if (normalized.every((item): item is string => typeof item === "string")) return normalized;
    if (normalized.every((item): item is number => typeof item === "number")) return normalized;
    throw new TypeError("D1 Better Auth arrays must contain one scalar type");
  }
  throw new TypeError("D1 Better Auth values must be scalar or scalar arrays");
}

function authWhere(where: CleanedWhere[] | undefined): D1AuthWhere[] | undefined {
  return where?.map((item) => ({
    field: item.field,
    operator: item.operator as D1AuthWhere["operator"],
    value: scalar(item.value),
    connector: item.connector as D1AuthWhere["connector"],
  }));
}

function query(model: string, input: { where?: CleanedWhere[]; limit?: number; offset?: number; sortBy?: { field: string; direction: "asc" | "desc" }; select?: string[] }): D1AuthQuery {
  return { model: modelName(model), where: authWhere(input.where), limit: input.limit, offset: input.offset, sortBy: input.sortBy, select: input.select };
}

function values(data: unknown): Record<string, D1AuthValue> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) throw new TypeError("Better Auth data must be an object");
  return Object.fromEntries(Object.entries(data as Record<string, unknown>).map(([key, value]) => [key, scalar(value)]));
}

async function resultRows<T>(transport: D1TransportClient, request: Parameters<D1TransportClient["execute"]>[0]): Promise<T[]> {
  const result = await transport.execute(request);
  if (!result.success) throw new Error("D1 Better Auth operation failed");
  return result.results as T[];
}

export function createD1BetterAuthAdapter(transport: D1TransportClient) {
  const create: CustomAdapter["create"] = async ({ model, data, select }) => {
    const [created] = await resultRows(transport, operation({ name: "authCreate", model: modelName(model), data: values(data), select }));
    return (created ?? {}) as never;
  };
  const findOne: CustomAdapter["findOne"] = async ({ model, where, select }) => {
    const [found] = await resultRows(transport, operation({ name: "authFindOne", query: query(model, { where, select }) }));
    return found ? (found as never) : null;
  };
  const findMany: CustomAdapter["findMany"] = async ({ model, where, limit, select, sortBy, offset }) => resultRows(transport, operation({ name: "authFindMany", query: query(model, { where, limit, select, sortBy, offset }) }));
  const count: CustomAdapter["count"] = async ({ model, where }) => Number((await resultRows<{ count: number }>(transport, operation({ name: "authCount", query: query(model, { where }) })))[0]?.count ?? 0);
  const update: CustomAdapter["update"] = async ({ model, where, update }) => {
    const [updated] = await resultRows(transport, operation({ name: "authUpdate", query: query(model, { where }), update: values(update) }));
    return updated ? (updated as never) : null;
  };
  const updateMany: CustomAdapter["updateMany"] = async ({ model, where, update }) => Number((await transport.execute(operation({ name: "authUpdateMany", query: query(model, { where }), update: values(update) }))).meta?.changes ?? 0);
  const remove: CustomAdapter["delete"] = async ({ model, where }) => {
    await transport.execute(operation({ name: "authDelete", query: query(model, { where }) }));
  };
  const deleteMany: CustomAdapter["deleteMany"] = async ({ model, where }) => Number((await transport.execute(operation({ name: "authDeleteMany", query: query(model, { where }) }))).meta?.changes ?? 0);
  const consumeOne: NonNullable<CustomAdapter["consumeOne"]> = async ({ model, where }) => {
    const [consumed] = await resultRows(transport, operation({ name: "authConsumeOne", query: query(model, { where }) }));
    return consumed ? (consumed as never) : null;
  };
  const incrementOne: NonNullable<CustomAdapter["incrementOne"]> = async ({ model, where, increment, set }) => {
    const [updated] = await resultRows(transport, operation({ name: "authIncrementOne", query: query(model, { where }), increment, set: set ? values(set) : undefined }));
    return updated ? (updated as never) : null;
  };
  const adapter: CustomAdapter = { create, findOne, findMany, count, update, updateMany, delete: remove, deleteMany, consumeOne, incrementOne };

  return createAdapterFactory({
    config: {
      adapterId: "english-loop-d1",
      adapterName: "EnglishLoop D1",
      supportsBooleans: true,
      supportsDates: true,
      supportsJSON: false,
      supportsArrays: false,
      transaction: false,
    },
    adapter: () => adapter,
  });
}
