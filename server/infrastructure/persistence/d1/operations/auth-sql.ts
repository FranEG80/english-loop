import type { D1DatabaseLike, D1Value } from "../types/binding";
import type { D1AuthModel, D1AuthWhere, D1Operation } from "../types/operations";
import { d1Value } from "./values";
import { bind, type PreparedOperation } from "./shared";

const AUTH_FIELDS: Record<D1AuthModel, readonly string[]> = {
  user: ["id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt"],
  session: ["id", "expiresAt", "token", "createdAt", "updatedAt", "ipAddress", "userAgent", "userId"],
  account: ["id", "accountId", "providerId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "scope", "password", "createdAt", "updatedAt", "userId"],
  verification: ["id", "identifier", "value", "expiresAt", "createdAt", "updatedAt"],
};

const AUTH_TABLES: Record<D1AuthModel, string> = {
  user: "User", session: "Session", account: "Account", verification: "Verification",
};

function authField(model: D1AuthModel, field: string): string {
  if (!AUTH_FIELDS[model].includes(field)) throw new Error(`Unsupported Better Auth field: ${model}.${field}`);
  return `"${field}"`;
}

function authWhere(model: D1AuthModel, where: D1AuthWhere[] | undefined): { sql: string; values: D1Value[] } {
  if (!where || where.length === 0) return { sql: "1 = 1", values: [] };
  const values: D1Value[] = [];
  const clauses = where.map((item, index) => {
    const field = authField(model, item.field);
    const operator = item.operator ?? "eq";
    const connector = index === 0 ? "" : ` ${item.connector ?? "AND"} `;
    if ((operator === "in" || operator === "not_in") && Array.isArray(item.value)) {
      if (item.value.length === 0) return `${connector}${operator === "in" ? "0 = 1" : "1 = 1"}`;
      values.push(...item.value.map((value) => d1Value(value)));
      return `${connector}${field} ${operator === "in" ? "IN" : "NOT IN"} (${item.value.map(() => "?").join(", ")})`;
    }
    const scalar = Array.isArray(item.value) ? item.value[0] ?? null : item.value;
    const sqlOperator = operator === "eq" ? "=" : operator === "ne" ? "!=" : operator === "lt" ? "<" : operator === "lte" ? "<=" : operator === "gt" ? ">" : operator === "gte" ? ">=" : "LIKE";
    values.push(d1Value(operator === "contains" ? `%${String(scalar)}%` : operator === "starts_with" ? `${String(scalar)}%` : operator === "ends_with" ? `%${String(scalar)}` : scalar));
    return `${connector}${field} ${sqlOperator} ?`;
  });
  return { sql: clauses.join(""), values };
}

function authSelect(model: D1AuthModel, select?: string[]): string {
  const fields = select && select.length > 0 ? select : [...AUTH_FIELDS[model]];
  return fields.map((field) => authField(model, field)).join(", ");
}

type AuthOperation = Extract<D1Operation, { name: `auth${string}` }>;

export function prepareAuthOperation(database: D1DatabaseLike, operation: AuthOperation): PreparedOperation {
  const model = "query" in operation ? operation.query.model : operation.model;
  const table = AUTH_TABLES[model];
  if (operation.name === "authCreate") {
    const fields = Object.keys(operation.data);
    fields.forEach((field) => authField(model, field));
    const columns = fields.length > 0 ? fields.map((field) => authField(model, field)).join(", ") : "id";
    const placeholders = fields.length > 0 ? fields.map(() => "?").join(", ") : "lower(hex(randomblob(16)))";
    return bind(database, `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING ${authSelect(model, operation.select)}`,
      fields.length > 0 ? fields.map((field) => d1Value(operation.data[field])) : [], true);
  }

  const query = operation.query;
  const where = authWhere(model, query.where);
  const order = query.sortBy ? ` ORDER BY ${authField(model, query.sortBy.field)} ${query.sortBy.direction === "desc" ? "DESC" : "ASC"}` : "";
  const paginationValues: D1Value[] = [];
  if (query.limit !== undefined) paginationValues.push(query.limit);
  if (query.offset !== undefined) paginationValues.push(query.offset);
  if (operation.name === "authFindOne" || operation.name === "authFindMany") {
    return bind(database, `SELECT ${authSelect(model, query.select)} FROM ${table} WHERE ${where.sql}${order}${operation.name === "authFindOne" ? " LIMIT 1" : `${query.limit === undefined ? "" : " LIMIT ?"}${query.offset === undefined ? "" : " OFFSET ?"}`}`,
      [...where.values, ...(operation.name === "authFindOne" ? [] : paginationValues)]);
  }
  if (operation.name === "authCount") return bind(database, `SELECT COUNT(*) AS count FROM ${table} WHERE ${where.sql}`, where.values);
  if (operation.name === "authDelete" || operation.name === "authDeleteMany") {
    return bind(database, `DELETE FROM ${table} WHERE ${where.sql}${operation.name === "authDelete" ? ` AND id = (SELECT id FROM ${table} WHERE ${where.sql} LIMIT 1)` : ""}`,
      operation.name === "authDelete" ? [...where.values, ...where.values] : where.values, true);
  }
  if (operation.name === "authConsumeOne") {
    return bind(database, `DELETE FROM ${table} WHERE id = (SELECT id FROM ${table} WHERE ${where.sql} LIMIT 1) RETURNING ${authSelect(model, query.select)}`, where.values, true);
  }
  if (operation.name === "authUpdate" || operation.name === "authUpdateMany") {
    const fields = Object.keys(operation.update);
    fields.forEach((field) => authField(model, field));
    const assignments = fields.map((field) => `${authField(model, field)} = ?`).join(", ");
    const values = fields.map((field) => d1Value(operation.update[field]));
    const isOne = operation.name === "authUpdate";
    const updateWhere = isOne ? `${where.sql} AND id = (SELECT id FROM ${table} WHERE ${where.sql} LIMIT 1)` : where.sql;
    return bind(database, `UPDATE ${table} SET ${assignments} WHERE ${updateWhere}${isOne ? ` RETURNING ${authSelect(model, query.select)}` : ""}`,
      isOne ? [...values, ...where.values, ...where.values] : [...values, ...where.values], true);
  }
  const assignments = Object.keys(operation.increment).map((field) => `${authField(model, field)} = ${authField(model, field)} + ?`);
  const values: D1Value[] = Object.entries(operation.increment).map(([, value]) => value);
  for (const [field, value] of Object.entries(operation.set ?? {})) {
    assignments.push(`${authField(model, field)} = ?`);
    values.push(d1Value(value));
  }
  return bind(database, `UPDATE ${table} SET ${assignments.join(", ")} WHERE ${where.sql} RETURNING ${authSelect(model, query.select)}`,
    [...values, ...where.values], true);
}
