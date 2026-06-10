// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { deriveNotifications } from "@/lib/notifications";
import type { MonthlySummary } from "@/lib/dashboard";
import type { BudgetWithSpent } from "@/lib/budgets";
import type { CategoryKey } from "@/lib/categories";

const D = (v: string) => new Prisma.Decimal(v);

function summary(
  categories: { category: CategoryKey; spent: string; target: string }[],
): MonthlySummary {
  return {
    month: "2026-06",
    income: D("2500"),
    carryIn: D("0"),
    base: D("2500"),
    totalSpent: D("0"),
    balance: D("0"),
    categories: categories.map((c) => ({
      category: c.category,
      spent: D(c.spent),
      target: D(c.target),
    })),
    closed: false,
  };
}

function budget(over: Partial<BudgetWithSpent> & { id: string }): BudgetWithSpent {
  return {
    name: "Budget",
    targetAmount: D("100"),
    spent: D("0"),
    category: "leisure",
    deadline: null,
    ...over,
  };
}

const noCat = summary([]);

describe("deriveNotifications — categories", () => {
  it("flags a category over its 50/30/20 target", () => {
    const out = deriveNotifications(
      summary([{ category: "leisure", spent: "800", target: "750" }]),
      [],
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      kind: "categoryOver",
      tone: "over",
      values: { category: "leisure" },
    });
  });

  it("does not flag a category at or under target, or with target 0", () => {
    expect(
      deriveNotifications(summary([{ category: "leisure", spent: "750", target: "750" }]), []),
    ).toHaveLength(0);
    expect(
      deriveNotifications(summary([{ category: "leisure", spent: "10", target: "0" }]), []),
    ).toHaveLength(0);
  });
});

describe("deriveNotifications — spending budgets", () => {
  it("nothing below 80%", () => {
    expect(deriveNotifications(noCat, [budget({ id: "b1", spent: D("79") })])).toHaveLength(0);
  });
  it("warning from 80% to 99%", () => {
    expect(deriveNotifications(noCat, [budget({ id: "b1", spent: D("80") })])[0]).toMatchObject({
      kind: "budgetWarning",
      tone: "warning",
      values: { name: "Budget", percent: 80 },
    });
    expect(deriveNotifications(noCat, [budget({ id: "b1", spent: D("99") })])[0].kind).toBe(
      "budgetWarning",
    );
  });
  it("over at 100%+, never both warning and over", () => {
    const out = deriveNotifications(noCat, [budget({ id: "b1", spent: D("120") })]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ kind: "budgetOver", tone: "over", values: { name: "Budget" } });
  });
  it("ignores targetAmount <= 0", () => {
    expect(
      deriveNotifications(noCat, [budget({ id: "b1", targetAmount: D("0"), spent: D("50") })]),
    ).toHaveLength(0);
  });
});

describe("deriveNotifications — savings budgets", () => {
  const sav = (spent: string) =>
    budget({
      id: "s1",
      name: "Fonds",
      category: "savings",
      targetAmount: D("1000"),
      spent: D(spent),
    });
  it("nothing below 90%", () => {
    expect(deriveNotifications(noCat, [sav("899")])).toHaveLength(0);
  });
  it("savingsGoalNear from 90%, not reached", () => {
    expect(deriveNotifications(noCat, [sav("900")])[0]).toMatchObject({
      kind: "savingsGoalNear",
      tone: "accent",
      values: { name: "Fonds", remaining: "100", reached: false },
    });
  });
  it("reached at 100%+ (never warning/over)", () => {
    const out = deriveNotifications(noCat, [sav("1000")]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      kind: "savingsGoalNear",
      tone: "accent",
      values: { reached: true },
    });
  });
});

describe("deriveNotifications — ordering", () => {
  it("sorts savings, then warning, then categoryOver, then over", () => {
    const out = deriveNotifications(
      summary([{ category: "leisure", spent: "800", target: "750" }]),
      [
        budget({ id: "over1", name: "Resto", spent: D("130") }),
        budget({ id: "warn1", name: "Sport", spent: D("85") }),
        budget({
          id: "sav1",
          name: "Fonds",
          category: "savings",
          targetAmount: D("1000"),
          spent: D("950"),
        }),
      ],
    );
    expect(out.map((n) => n.kind)).toEqual([
      "savingsGoalNear",
      "budgetWarning",
      "categoryOver",
      "budgetOver",
    ]);
  });
});
