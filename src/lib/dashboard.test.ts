// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/incomes", () => ({ listMonthIncomes: vi.fn() }));
vi.mock("@/lib/expenses", () => ({ listMonthExpenses: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { monthlyPeriod: { findUnique: vi.fn() } } }));

import { Prisma } from "@/generated/prisma/client";
import { listMonthIncomes } from "@/lib/incomes";
import { listMonthExpenses } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";
import { getMonthlySummary } from "@/lib/dashboard";

describe("getMonthlySummary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("aggregates income, spend per category and balance (no carry)", async () => {
    vi.mocked(listMonthIncomes).mockResolvedValue([{ amount: "2000" }] as never);
    vi.mocked(listMonthExpenses).mockResolvedValue([
      { amount: "500", category: "essential" },
      { amount: "100", category: "leisure" },
    ] as never);
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);

    const summary = await getMonthlySummary("2026-06");

    expect(summary.income.toString()).toBe("2000");
    expect(summary.carryIn.toString()).toBe("0");
    expect(summary.base.toString()).toBe("2000");
    expect(summary.totalSpent.toString()).toBe("600");
    expect(summary.balance.toString()).toBe("1400");
    expect(summary.closed).toBe(false);
    const essential = summary.categories.find((c) => c.category === "essential");
    expect(essential?.spent.toString()).toBe("500");
    expect(essential?.target.toString()).toBe("1000");
  });

  it("derives base, targets and balance from the period carryIn", async () => {
    vi.mocked(listMonthIncomes).mockResolvedValue([{ amount: "2500" }] as never);
    vi.mocked(listMonthExpenses).mockResolvedValue([
      { amount: "1000", category: "essential" },
    ] as never);
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue({
      month: "2026-06",
      carryIn: new Prisma.Decimal("600"),
      carryOut: null,
      closedAt: null,
    } as never);

    const summary = await getMonthlySummary("2026-06");

    expect(summary.carryIn.toString()).toBe("600");
    expect(summary.base.toString()).toBe("3100");
    expect(summary.balance.toString()).toBe("2100");
    expect(summary.closed).toBe(false);
    const essential = summary.categories.find((c) => c.category === "essential");
    expect(essential?.target.toString()).toBe("1550");
  });

  it("returns zero targets when base is not positive", async () => {
    vi.mocked(listMonthIncomes).mockResolvedValue([] as never);
    vi.mocked(listMonthExpenses).mockResolvedValue([] as never);
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);

    const summary = await getMonthlySummary("2026-06");

    expect(summary.income.toString()).toBe("0");
    expect(summary.categories[0]?.target.toString()).toBe("0");
  });

  it("reports a closed month", async () => {
    vi.mocked(listMonthIncomes).mockResolvedValue([] as never);
    vi.mocked(listMonthExpenses).mockResolvedValue([] as never);
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue({
      carryIn: new Prisma.Decimal("0"),
      closedAt: new Date(),
    } as never);

    const summary = await getMonthlySummary("2026-05");
    expect(summary.closed).toBe(true);
  });
});
