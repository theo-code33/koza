import { describe, it, expect } from "vitest";
import { monthRange } from "@/lib/month";

describe("monthRange", () => {
  it("returns the first day of the month and of the next month", () => {
    const { start, end } = monthRange("2026-06");
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(5); // juin = index 5
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(6); // juillet
    expect(end.getDate()).toBe(1);
  });
});
