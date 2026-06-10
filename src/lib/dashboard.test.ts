// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/incomes", () => ({ listMonthIncomes: vi.fn() }));
vi.mock("@/lib/expenses", () => ({ listMonthExpenses: vi.fn() }));

import { listMonthIncomes } from "@/lib/incomes";
import { listMonthExpenses } from "@/lib/expenses";
import { getMonthlySummary } from "@/lib/dashboard";

describe("getMonthlySummary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("aggregates income, spend per category, balance and previous total", async () => {
    vi.mocked(listMonthIncomes).mockResolvedValue([{ amount: "2000" }] as never);
    vi.mocked(listMonthExpenses).mockImplementation(((month: string) =>
      Promise.resolve(
        month === "2026-06"
          ? [
              { amount: "500", category: "essential" },
              { amount: "100", category: "leisure" },
            ]
          : [{ amount: "400", category: "essential" }],
      )) as never);

    const summary = await getMonthlySummary("2026-06");

    expect(summary.income.toString()).toBe("2000");
    expect(summary.totalSpent.toString()).toBe("600");
    expect(summary.balance.toString()).toBe("1400");
    expect(summary.previousTotalSpent.toString()).toBe("400");
    const essential = summary.categories.find((c) => c.category === "essential");
    expect(essential?.spent.toString()).toBe("500");
    expect(essential?.target.toString()).toBe("1000");
  });

  it("returns zero targets when there is no income", async () => {
    vi.mocked(listMonthIncomes).mockResolvedValue([] as never);
    vi.mocked(listMonthExpenses).mockResolvedValue([] as never);

    const summary = await getMonthlySummary("2026-06");

    expect(summary.income.toString()).toBe("0");
    expect(summary.categories[0]?.target.toString()).toBe("0");
  });
});
