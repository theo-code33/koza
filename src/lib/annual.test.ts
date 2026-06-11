// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: { expense: { findMany: vi.fn() } } }));

import { prisma } from "@/lib/prisma";
import { getAnnualSummary } from "@/lib/annual";

function mockExpenses(rows: { amount: string; category: string; month: string }[]) {
  vi.mocked(prisma.expense.findMany).mockResolvedValue(rows as never);
}

describe("getAnnualSummary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("totals spend per category in CATEGORY_ORDER", async () => {
    mockExpenses([
      { amount: "500", category: "essential", month: "2026-01" },
      { amount: "200", category: "leisure", month: "2026-02" },
      { amount: "300", category: "savings", month: "2026-03" },
      { amount: "100", category: "essential", month: "2026-04" },
    ]);

    const summary = await getAnnualSummary("u1", "2026");

    expect(summary.totals.map((t) => t.category)).toEqual(["essential", "leisure", "savings"]);
    expect(summary.totals[0]?.spent.toString()).toBe("600");
    expect(summary.totals[1]?.spent.toString()).toBe("200");
    expect(summary.totals[2]?.spent.toString()).toBe("300");
    expect(summary.totalSpent.toString()).toBe("1100");
  });

  it("produces 12 monthly points with zeros for empty months", async () => {
    mockExpenses([{ amount: "150", category: "leisure", month: "2026-03" }]);

    const summary = await getAnnualSummary("u1", "2026");

    expect(summary.monthly).toHaveLength(12);
    expect(summary.monthly[0]?.month).toBe("2026-01");
    expect(summary.monthly[11]?.month).toBe("2026-12");
    expect(summary.monthly[0]?.leisure.toString()).toBe("0");
    expect(summary.monthly[2]?.leisure.toString()).toBe("150");
  });

  it("accumulates savings cumulatively across 12 months", async () => {
    mockExpenses([
      { amount: "100", category: "savings", month: "2026-01" },
      { amount: "50", category: "savings", month: "2026-03" },
      { amount: "999", category: "essential", month: "2026-02" },
    ]);

    const summary = await getAnnualSummary("u1", "2026");

    expect(summary.savingsCumulative).toHaveLength(12);
    expect(summary.savingsCumulative[0]?.cumulative.toString()).toBe("100");
    expect(summary.savingsCumulative[1]?.cumulative.toString()).toBe("100");
    expect(summary.savingsCumulative[2]?.cumulative.toString()).toBe("150");
    expect(summary.savingsCumulative[11]?.cumulative.toString()).toBe("150");
  });

  it("returns all zeros for an empty year", async () => {
    mockExpenses([]);

    const summary = await getAnnualSummary("u1", "2026");

    expect(summary.totalSpent.toString()).toBe("0");
    expect(summary.totals.every((t) => t.spent.toString() === "0")).toBe(true);
    expect(summary.monthly).toHaveLength(12);
    expect(summary.savingsCumulative[11]?.cumulative.toString()).toBe("0");
  });

  it("scopes the query by userId and year prefix", async () => {
    mockExpenses([]);

    await getAnnualSummary("u1", "2026");

    expect(prisma.expense.findMany).toHaveBeenCalledWith({
      where: { userId: "u1", month: { startsWith: "2026" } },
    });
  });
});
