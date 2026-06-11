// @vitest-environment node
import { describe, it, expect } from "vitest";
import { authConfig } from "@/auth.config";

const authorized = authConfig.callbacks!.authorized!;

function call(pathname: string, auth: unknown) {
  return authorized({
    request: { nextUrl: { pathname } },
    auth,
  } as Parameters<typeof authorized>[0]);
}

describe("authConfig.authorized", () => {
  it("allows public routes without a session", () => {
    expect(call("/", null)).toBe(true);
    expect(call("/login", null)).toBe(true);
    expect(call("/signup", null)).toBe(true);
  });

  it("allows the auth and health api without a session", () => {
    expect(call("/api/auth/callback/credentials", null)).toBe(true);
    expect(call("/api/health", null)).toBe(true);
  });

  it("blocks protected routes without a session", () => {
    expect(call("/dashboard", null)).toBe(false);
  });

  it("blocks protected routes when the session has no user id (stale cookie)", () => {
    expect(call("/dashboard", { user: { email: "demo@koza.app" } })).toBe(false);
  });

  it("allows protected routes for a fully authenticated session", () => {
    expect(call("/dashboard", { user: { id: "u1" } })).toBe(true);
  });
});
