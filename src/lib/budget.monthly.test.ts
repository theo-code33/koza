// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { computeBase, computeTargets, computeCarryOut } from "@/lib/budget";

const D = (v: string) => new Prisma.Decimal(v);

describe("computeBase", () => {
  it("adds income and carryIn", () => {
    expect(computeBase(D("2500"), D("600")).toString()).toBe("3100");
    expect(computeBase(D("2500"), D("-200")).toString()).toBe("2300");
  });
});

describe("computeTargets", () => {
  it("splits the base 50/30/20", () => {
    const t = computeTargets(D("3100"));
    expect(t.essential.toString()).toBe("1550");
    expect(t.leisure.toString()).toBe("930");
    expect(t.savings.toString()).toBe("620");
  });

  it("returns zeros when base is not positive", () => {
    const t = computeTargets(D("-50"));
    expect(t.essential.toString()).toBe("0");
    expect(t.leisure.toString()).toBe("0");
    expect(t.savings.toString()).toBe("0");
  });
});

describe("computeCarryOut", () => {
  it("is base minus spent, can be negative", () => {
    expect(computeCarryOut(D("2800"), D("2200")).toString()).toBe("600");
    expect(computeCarryOut(D("2800"), D("3000")).toString()).toBe("-200");
  });
});
