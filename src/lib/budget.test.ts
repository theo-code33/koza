import { describe, it, expect } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { computeEnvelopes } from "@/lib/budget";

describe("computeEnvelopes", () => {
  it("splits a total into 50 / 30 / 20", () => {
    const envelopes = computeEnvelopes("2500");
    expect(envelopes.essential.toString()).toBe("1250");
    expect(envelopes.leisure.toString()).toBe("750");
    expect(envelopes.savings.toString()).toBe("500");
  });

  it("returns zeros for a zero total", () => {
    const envelopes = computeEnvelopes(0);
    expect(envelopes.essential.toString()).toBe("0");
    expect(envelopes.leisure.toString()).toBe("0");
    expect(envelopes.savings.toString()).toBe("0");
  });

  it("keeps the envelopes summing to the total", () => {
    const envelopes = computeEnvelopes(new Prisma.Decimal("3200.50"));
    const sum = envelopes.essential.plus(envelopes.leisure).plus(envelopes.savings);
    expect(sum.toString()).toBe("3200.5");
  });
});
