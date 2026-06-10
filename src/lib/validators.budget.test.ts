import { describe, it, expect } from "vitest";
import { budgetCreateSchema, expenseCreateSchema } from "@/lib/validators";

const validBudget = { name: "Vacances", targetAmount: "1200.00", category: "leisure" };

describe("budgetCreateSchema", () => {
  it("accepts a valid budget with and without a deadline", () => {
    expect(budgetCreateSchema.safeParse(validBudget).success).toBe(true);
    expect(budgetCreateSchema.safeParse({ ...validBudget, deadline: "2026-08-01" }).success).toBe(
      true,
    );
  });

  it("rejects an empty name and a non-positive target", () => {
    expect(budgetCreateSchema.safeParse({ ...validBudget, name: " " }).success).toBe(false);
    expect(budgetCreateSchema.safeParse({ ...validBudget, targetAmount: "0" }).success).toBe(false);
  });
});

describe("expenseCreateSchema with budgetId", () => {
  const base = {
    amount: "10.00",
    description: "Hotel",
    date: "2026-06-10",
    category: "leisure",
    subcategory: "vacations",
  };

  it("accepts an optional budgetId and works without it", () => {
    expect(expenseCreateSchema.safeParse(base).success).toBe(true);
    expect(expenseCreateSchema.safeParse({ ...base, budgetId: "b1" }).success).toBe(true);
    expect(expenseCreateSchema.safeParse({ ...base, budgetId: null }).success).toBe(true);
  });
});
