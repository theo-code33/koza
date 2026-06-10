// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { monthlyPeriod: { findUnique: vi.fn() } },
}));

import { isMonthOpen } from "@/lib/period-guard";
import { prisma } from "@/lib/prisma";

describe("isMonthOpen", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is open when no period exists", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);
    expect(await isMonthOpen("2026-06")).toBe(true);
  });

  it("is open when the period has no closedAt", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue({ closedAt: null } as never);
    expect(await isMonthOpen("2026-06")).toBe(true);
  });

  it("is closed when closedAt is set", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue({ closedAt: new Date() } as never);
    expect(await isMonthOpen("2026-05")).toBe(false);
  });
});
