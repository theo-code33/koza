// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const set = vi.fn();
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ set }) }));
vi.mock("@/lib/prisma", () => ({
  prisma: { userSettings: { upsert: vi.fn() } },
}));

import { setLocaleAction } from "@/app/actions/locale";
import { prisma } from "@/lib/prisma";

describe("setLocaleAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists a valid locale to the DB and the cookie", async () => {
    await setLocaleAction("en");
    expect(prisma.userSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "default" },
        update: { locale: "en" },
        create: { id: "default", locale: "en" },
      }),
    );
    expect(set).toHaveBeenCalledWith("NEXT_LOCALE", "en", expect.objectContaining({ path: "/" }));
  });

  it("ignores an invalid locale", async () => {
    await setLocaleAction("de" as never);
    expect(prisma.userSettings.upsert).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });
});
