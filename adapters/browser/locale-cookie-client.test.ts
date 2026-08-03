import { describe, expect, it } from "vitest";
import { LOCALE_COOKIE_NAME } from "./cookie-names";
import { readLocaleCookieClient, writeLocaleCookieClient } from "./locale-cookie-client";

describe("locale browser cookie adapter", () => {
  it("reads valid values, falls back for invalid values and writes a persistent cookie", () => {
    document.cookie = `${LOCALE_COOKIE_NAME}=en`;
    expect(readLocaleCookieClient()).toBe("en");
    document.cookie = `${LOCALE_COOKIE_NAME}=invalid`;
    expect(readLocaleCookieClient()).toBe("es");
    writeLocaleCookieClient("en");
    expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=en`);
  });
});
