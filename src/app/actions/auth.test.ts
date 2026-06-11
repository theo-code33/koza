// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));
vi.mock("@/auth", () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

import { signupAction } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";

describe("signupAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an invalid email/password without creating a user", async () => {
    const res = await signupAction("nope", "short");
    expect(res.error).toBe("invalidCredentials");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1" } as never);
    const res = await signupAction("taken@koza.app", "password123");
    expect(res.error).toBe("emailTaken");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("creates a user with a hashed password and settings", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: "u9" } as never);
    await signupAction("new@koza.app", "password123");
    const arg = vi.mocked(prisma.user.create).mock.calls[0][0] as {
      data: { email: string; passwordHash: string; settings: unknown };
    };
    expect(arg.data.email).toBe("new@koza.app");
    expect(arg.data.passwordHash).not.toBe("password123");
    expect(arg.data.passwordHash.length).toBeGreaterThan(20);
    expect(arg.data.settings).toEqual({ create: {} });
  });
});
