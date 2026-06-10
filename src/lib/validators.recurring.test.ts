// @vitest-environment node
import { describe, it, expect } from "vitest";
import { recurringCreateSchema, occurrenceConfirmSchema } from "@/lib/validators";

const base = {
  label: "Loyer",
  type: "FIXED",
  amount: "800.00",
  category: "essential",
  subcategory: "housing",
  frequency: "MONTHLY",
  anchorMonth: "2026-01",
};

describe("recurringCreateSchema", () => {
  it("accepts a valid model and an optional endMonth", () => {
    expect(recurringCreateSchema.safeParse(base).success).toBe(true);
    expect(recurringCreateSchema.safeParse({ ...base, endMonth: "2026-12" }).success).toBe(true);
  });

  it("rejects a bad type, frequency, amount or anchor", () => {
    expect(recurringCreateSchema.safeParse({ ...base, type: "X" }).success).toBe(false);
    expect(recurringCreateSchema.safeParse({ ...base, frequency: "WEEKLY" }).success).toBe(false);
    expect(recurringCreateSchema.safeParse({ ...base, amount: "0" }).success).toBe(false);
    expect(recurringCreateSchema.safeParse({ ...base, anchorMonth: "2026-1" }).success).toBe(false);
  });
});

describe("occurrenceConfirmSchema", () => {
  it("requires a positive amount", () => {
    expect(occurrenceConfirmSchema.safeParse({ amount: "42.00" }).success).toBe(true);
    expect(occurrenceConfirmSchema.safeParse({ amount: "0" }).success).toBe(false);
  });
});
