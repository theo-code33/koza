// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { userSettings: { findUnique: vi.fn() } },
}));

import { getOnboardingCompleted } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

describe("getOnboardingCompleted", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the stored flag", async () => {
    vi.mocked(prisma.userSettings.findUnique).mockResolvedValue({
      onboardingCompleted: true,
    } as never);
    expect(await getOnboardingCompleted()).toBe(true);
  });

  it("returns false when there is no settings row", async () => {
    vi.mocked(prisma.userSettings.findUnique).mockResolvedValue(null as never);
    expect(await getOnboardingCompleted()).toBe(false);
  });
});
