// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { budget: { findMany: vi.fn() } },
}));

import { listBudgetsWithSpent } from "@/lib/budgets";
import { prisma } from "@/lib/prisma";

describe("listBudgetsWithSpent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sums the linked expenses into spent", async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([
      {
        id: "b1",
        name: "Grèce",
        targetAmount: "1200",
        category: "leisure",
        deadline: null,
        expenses: [{ amount: "250" }, { amount: "100" }],
      },
    ] as never);
    const result = await listBudgetsWithSpent();
    expect(prisma.budget.findMany).toHaveBeenCalledWith({
      include: { expenses: { select: { amount: true } } },
      orderBy: { createdAt: "asc" },
    });
    expect(result[0].spent.toString()).toBe("350");
  });
});
