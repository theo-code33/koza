// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildDemoDataset } from "@/lib/demo-data";

const data = buildDemoDataset("2026-06");

describe("buildDemoDataset", () => {
  it("covers 2026-01 through the current month, only the last open", () => {
    expect(data.periods.map((p) => p.month)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
    ]);
    expect(data.periods.filter((p) => !p.closed)).toHaveLength(1);
    expect(data.periods[data.periods.length - 1]?.closed).toBe(false);
    expect(data.periods[0]?.closed).toBe(true);
  });

  it("keeps a consistent carry chain", () => {
    expect(data.periods[0]?.carryIn).toBe("0.00");
    for (const period of data.periods) {
      const income = data.incomes
        .filter((x) => x.month === period.month)
        .reduce((acc, x) => acc + Number(x.amount), 0);
      const spent = data.expenses
        .filter((x) => x.month === period.month)
        .reduce((acc, x) => acc + Number(x.amount), 0);
      const expectedCarryOut = Number(period.carryIn) + income - spent;
      if (period.closed) {
        expect(Number(period.carryOut)).toBeCloseTo(expectedCarryOut, 2);
      } else {
        expect(period.carryOut).toBeNull();
      }
    }
    for (let i = 1; i < data.periods.length; i++) {
      expect(data.periods[i]?.carryIn).toBe(data.periods[i - 1]?.carryOut);
    }
  });

  it("materializes the rent every single month", () => {
    for (const period of data.periods) {
      const rent = data.expenses.find(
        (e) => e.recurringKey === "loyer" && e.month === period.month,
      );
      expect(rent, `loyer manquant pour ${period.month}`).toBeTruthy();
      expect(rent?.amount).toBe("850.00");
    }
  });

  it("leaves the current-month electricity PENDING with no expense", () => {
    const current = data.occurrences.find(
      (o) => o.recurringKey === "electricite" && o.month === "2026-06",
    );
    expect(current?.status).toBe("PENDING");
    expect(
      data.expenses.some((e) => e.recurringKey === "electricite" && e.month === "2026-06"),
    ).toBe(false);
    const past = data.occurrences.find(
      (o) => o.recurringKey === "electricite" && o.month === "2026-02",
    );
    expect(past?.status).toBe("CONFIRMED");
    expect(
      data.expenses.some((e) => e.recurringKey === "electricite" && e.month === "2026-02"),
    ).toBe(true);
  });

  it("references only existing budgets/recurring, and links applied occurrences to an expense", () => {
    const budgetKeys = new Set(data.budgets.map((b) => b.key));
    const recurringKeys = new Set(data.recurring.map((r) => r.key));
    for (const e of data.expenses) {
      if (e.budgetKey) expect(budgetKeys.has(e.budgetKey)).toBe(true);
      if (e.recurringKey) expect(recurringKeys.has(e.recurringKey)).toBe(true);
    }
    for (const o of data.occurrences) {
      expect(recurringKeys.has(o.recurringKey)).toBe(true);
      if (o.status !== "PENDING") {
        expect(
          data.expenses.some((e) => e.recurringKey === o.recurringKey && e.month === o.month),
        ).toBe(true);
      }
    }
  });

  it("includes a past month with a negative balance while the current month stays healthy", () => {
    // Au moins un mois clôturé en dépassement (report sortant négatif) — pour démontrer
    // l'UI de balance négative.
    const closedNegative = data.periods.filter((p) => p.closed && Number(p.carryOut) < 0);
    expect(closedNegative.length).toBeGreaterThanOrEqual(1);

    // Le mois courant (ouvert) reste sain : revenus + report entrant − dépenses >= 0.
    const current = data.periods[data.periods.length - 1]!;
    const income = data.incomes
      .filter((x) => x.month === current.month)
      .reduce((acc, x) => acc + Number(x.amount), 0);
    const spent = data.expenses
      .filter((x) => x.month === current.month)
      .reduce((acc, x) => acc + Number(x.amount), 0);
    expect(Number(current.carryIn) + income - spent).toBeGreaterThanOrEqual(0);
  });

  it("uses positive two-decimal amount strings everywhere", () => {
    const all = [
      ...data.incomes.map((x) => x.amount),
      ...data.expenses.map((x) => x.amount),
      ...data.budgets.map((x) => x.targetAmount),
    ];
    for (const amount of all) {
      expect(amount).toMatch(/^\d+\.\d{2}$/);
      expect(Number(amount)).toBeGreaterThan(0);
    }
  });
});
