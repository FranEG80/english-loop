import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME, LOCALE_COOKIE_NAME } from "./cookie-names";

describe("cookie names", () => {
  it("keeps authentication and locale cookies distinct", () => {
    expect(AUTH_COOKIE_NAME).toBe("el_session");
    expect(LOCALE_COOKIE_NAME).toBe("el_locale");
    expect(AUTH_COOKIE_NAME).not.toBe(LOCALE_COOKIE_NAME);
  });
});
