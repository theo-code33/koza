// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { expense: { findMany: vi.fn() } },
}));

import { listMonthExpenses } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";

describe("listMonthExpenses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries expenses by month ordered by date desc", async () => {
    vi.mocked(prisma.expense.findMany).mockResolvedValue([{ id: "1" }] as never);
    const result = await listMonthExpenses("u1", "2026-06");
    expect(prisma.expense.findMany).toHaveBeenCalledWith({
      where: { userId: "u1", month: "2026-06" },
      orderBy: { date: "desc" },
    });
    expect(result).toHaveLength(1);
  });
});
