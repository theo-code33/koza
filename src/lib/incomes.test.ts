// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { income: { findMany: vi.fn() } },
}));

import { listMonthIncomes } from "@/lib/incomes";
import { prisma } from "@/lib/prisma";

describe("listMonthIncomes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries incomes for the month ordered by creation", async () => {
    vi.mocked(prisma.income.findMany).mockResolvedValue([{ id: "1" }] as never);
    const result = await listMonthIncomes("2026-06");
    expect(prisma.income.findMany).toHaveBeenCalledWith({
      where: { month: "2026-06" },
      orderBy: { createdAt: "asc" },
    });
    expect(result).toHaveLength(1);
  });
});
