import { describe, it, expect } from "vitest";
import { currentMonth } from "@/lib/month";

describe("currentMonth", () => {
  it("returns the current month as YYYY-MM", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(currentMonth()).toBe(expected);
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/);
  });
});
