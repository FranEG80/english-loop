import { expect, vi } from "vitest";
import { createApiRouteRoot } from "./api-route-fakes";

const apiRouteState = vi.hoisted(() => ({ root: null as unknown }));

vi.mock("@/server/infrastructure/composition/composition-root", () => ({
  get compositionRoot() {
    return apiRouteState.root;
  },
}));

export function resetApiRouteRoot() {
  const created = createApiRouteRoot();
  apiRouteState.root = created.root;
  return created;
}

export function routeRequest(url: string, init?: RequestInit) {
  return new Request(`http://test.local${url}`, init);
}

export function jsonRequest(url: string, body: unknown, method = "POST") {
  return routeRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function expectJson(response: Response, status = 200) {
  expect(response.status).toBe(status);
  expect(response.headers.get("content-type")).toContain("application/json");
  return response.json();
}
