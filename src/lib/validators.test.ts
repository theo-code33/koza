import { describe, it, expect } from "vitest";
import { incomeCreateSchema, settingsUpdateSchema } from "@/lib/validators";

describe("incomeCreateSchema", () => {
  it("accepts a valid income", () => {
    const result = incomeCreateSchema.safeParse({
      source: "Salaire",
      amount: "2500.00",
      month: "2026-06",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive amount, a bad month and an empty source", () => {
    expect(
      incomeCreateSchema.safeParse({ source: "X", amount: "0", month: "2026-06" }).success,
    ).toBe(false);
    expect(
      incomeCreateSchema.safeParse({ source: "X", amount: "10", month: "2026/06" }).success,
    ).toBe(false);
    expect(
      incomeCreateSchema.safeParse({ source: "  ", amount: "10", month: "2026-06" }).success,
    ).toBe(false);
  });
});

describe("settingsUpdateSchema", () => {
  it("accepts an onboarding flag update", () => {
    expect(settingsUpdateSchema.safeParse({ onboardingCompleted: true }).success).toBe(true);
  });

  it("rejects an empty object", () => {
    expect(settingsUpdateSchema.safeParse({}).success).toBe(false);
  });
});
