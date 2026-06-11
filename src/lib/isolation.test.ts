// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    income: { findMany: vi.fn().mockResolvedValue([]) },
    expense: { findMany: vi.fn().mockResolvedValue([]) },
    budget: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { listMonthIncomes } from "@/lib/incomes";
import { listMonthExpenses } from "@/lib/expenses";
import { listBudgetsWithSpent } from "@/lib/budgets";
import { prisma } from "@/lib/prisma";

describe("data isolation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scopes income queries by userId", async () => {
    await listMonthIncomes("u1", "2026-06");
    expect(prisma.income.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1", month: "2026-06" } }),
    );
  });

  it("scopes expense queries by userId", async () => {
    await listMonthExpenses("u2", "2026-06");
    expect(prisma.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u2", month: "2026-06" } }),
    );
  });

  it("scopes budget queries by userId", async () => {
    await listBudgetsWithSpent("u3");
    expect(prisma.budget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u3" } }),
    );
  });
});
