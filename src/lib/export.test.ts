// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    income: { findMany: vi.fn() },
    expense: { findMany: vi.fn() },
    budget: { findMany: vi.fn() },
    userSettings: { findUnique: vi.fn() },
  },
}));

import { Prisma } from "@/generated/prisma/client";
import { buildExport } from "@/lib/export";
import { prisma } from "@/lib/prisma";

describe("buildExport", () => {
  beforeEach(() => vi.clearAllMocks());

  it("aggregates all data with decimal amounts serialised as strings", async () => {
    vi.mocked(prisma.income.findMany).mockResolvedValue([
      { id: "i1", source: "Salaire", amount: new Prisma.Decimal("2000"), month: "2026-06" },
    ] as never);
    vi.mocked(prisma.expense.findMany).mockResolvedValue([
      { id: "e1", amount: new Prisma.Decimal("12.50"), description: "Pain" },
    ] as never);
    vi.mocked(prisma.budget.findMany).mockResolvedValue([
      { id: "b1", name: "Grèce", targetAmount: new Prisma.Decimal("1200") },
    ] as never);
    vi.mocked(prisma.userSettings.findUnique).mockResolvedValue({
      id: "default",
      theme: "light",
      locale: "fr",
      onboardingCompleted: true,
    } as never);

    const data = await buildExport("u1");

    expect(typeof data.exportedAt).toBe("string");
    expect((data.incomes[0] as { amount: string }).amount).toBe("2000");
    expect((data.expenses[0] as { amount: string }).amount).toBe("12.5");
    expect((data.budgets[0] as { targetAmount: string }).targetAmount).toBe("1200");
    expect(data.settings).toMatchObject({ locale: "fr" });
  });
});
