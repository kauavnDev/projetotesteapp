import { afterEach, describe, expect, it } from "vitest";
import { isAdminEmail } from "../src/lib/auth.js";

const original = process.env.ADMIN_EMAILS;
afterEach(() => {
  if (original === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = original;
});

describe("server-side administrator allowlist", () => {
  it("accepts only the two configured distinct addresses, case-insensitively", () => {
    process.env.ADMIN_EMAILS = "admin-one@example.test, ADMIN-TWO@example.test";
    expect(isAdminEmail("admin-one@example.test")).toBe(true);
    expect(isAdminEmail("ADMIN-TWO@example.test")).toBe(true);
    expect(isAdminEmail("friend@example.test")).toBe(false);
  });

  it("fails closed when the allowlist has fewer or more than two addresses", () => {
    process.env.ADMIN_EMAILS = "admin-one@example.test";
    expect(isAdminEmail("admin-one@example.test")).toBe(false);
    process.env.ADMIN_EMAILS = "admin-one@example.test,admin-two@example.test,third@example.test";
    expect(isAdminEmail("admin-one@example.test")).toBe(false);
  });

  it("fails closed for duplicate or malformed entries", () => {
    process.env.ADMIN_EMAILS = "admin-one@example.test,admin-one@example.test";
    expect(isAdminEmail("admin-one@example.test")).toBe(false);
    process.env.ADMIN_EMAILS = "admin-one,admin-two";
    expect(isAdminEmail("admin-one")).toBe(false);
  });
});
