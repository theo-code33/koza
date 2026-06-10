// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get }) }));
vi.mock("@/lib/prisma", () => ({
  prisma: { userSettings: { findUnique: vi.fn() } },
}));

import { resolveLocale, isLocale } from "@/i18n/locale";
import { prisma } from "@/lib/prisma";

describe("isLocale", () => {
  it("accepts known locales only", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("resolveLocale", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses a valid cookie first", async () => {
    get.mockReturnValue({ value: "en" });
    expect(await resolveLocale()).toBe("en");
    expect(prisma.userSettings.findUnique).not.toHaveBeenCalled();
  });

  it("falls back to the DB locale when the cookie is missing", async () => {
    get.mockReturnValue(undefined);
    vi.mocked(prisma.userSettings.findUnique).mockResolvedValue({ locale: "en" } as never);
    expect(await resolveLocale()).toBe("en");
  });

  it("falls back to the default when the cookie is invalid and no DB row", async () => {
    get.mockReturnValue({ value: "de" });
    vi.mocked(prisma.userSettings.findUnique).mockResolvedValue(null as never);
    expect(await resolveLocale()).toBe("fr");
  });
});
