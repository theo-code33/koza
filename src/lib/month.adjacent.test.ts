// @vitest-environment node
import { describe, it, expect } from "vitest";
import { previousMonth, nextMonth } from "@/lib/month";

describe("previousMonth", () => {
  it("decrements and crosses the year boundary", () => {
    expect(previousMonth("2026-06")).toBe("2026-05");
    expect(previousMonth("2026-01")).toBe("2025-12");
  });
});

describe("nextMonth", () => {
  it("increments and crosses the year boundary", () => {
    expect(nextMonth("2026-06")).toBe("2026-07");
    expect(nextMonth("2026-12")).toBe("2027-01");
  });
});
