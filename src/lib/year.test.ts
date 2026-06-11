import { describe, it, expect } from "vitest";
import { previousYear, nextYear, yearOf } from "@/lib/month";

describe("year helpers", () => {
  it("returns the previous year", () => {
    expect(previousYear("2026")).toBe("2025");
  });

  it("returns the next year", () => {
    expect(nextYear("2026")).toBe("2027");
  });

  it("extracts the year of a YYYY-MM month", () => {
    expect(yearOf("2026-03")).toBe("2026");
  });
});
