// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { expense: { findMany: vi.fn() } },
}));

import { listMonthExpenses } from "@/lib/expenses";
import { monthRange } from "@/lib/month";
import { prisma } from "@/lib/prisma";

describe("listMonthExpenses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries expenses within the month range ordered by date desc", async () => {
    vi.mocked(prisma.expense.findMany).mockResolvedValue([{ id: "1" }] as never);
    const result = await listMonthExpenses("2026-06");
    const { start, end } = monthRange("2026-06");
    expect(prisma.expense.findMany).toHaveBeenCalledWith({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
    });
    expect(result).toHaveLength(1);
  });
});
