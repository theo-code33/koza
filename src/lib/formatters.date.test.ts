import { describe, it, expect } from "vitest";
import { formatDate } from "@/lib/formatters";

describe("formatDate", () => {
  it("formats an ISO date in French (JJ/MM/AAAA)", () => {
    expect(formatDate("2026-06-10")).toBe("10/06/2026");
  });

  it("formats in English when asked", () => {
    expect(formatDate("2026-06-10", "en")).toBe("6/10/2026");
  });
});
