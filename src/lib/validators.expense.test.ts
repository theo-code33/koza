import { describe, it, expect } from "vitest";
import { expenseCreateSchema } from "@/lib/validators";

const valid = {
  amount: "54.90",
  description: "Courses",
  date: "2026-06-10",
  category: "essential",
  subcategory: "food",
};

describe("expenseCreateSchema", () => {
  it("accepts a valid expense", () => {
    expect(expenseCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-positive amount, a bad date and an empty description", () => {
    expect(expenseCreateSchema.safeParse({ ...valid, amount: "0" }).success).toBe(false);
    expect(expenseCreateSchema.safeParse({ ...valid, date: "2026-06" }).success).toBe(false);
    expect(expenseCreateSchema.safeParse({ ...valid, description: " " }).success).toBe(false);
  });

  it("rejects a subcategory that does not belong to the category", () => {
    expect(expenseCreateSchema.safeParse({ ...valid, category: "leisure" }).success).toBe(false);
  });
});
