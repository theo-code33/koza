import { describe, it, expect } from "vitest";

describe("test runner sanity", () => {
  it("does basic arithmetic", () => {
    expect(1 + 1).toBe(2);
  });
});
