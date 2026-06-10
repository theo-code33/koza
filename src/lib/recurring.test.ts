// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    recurringExpense: { findMany: vi.fn() },
    recurringOccurrence: { findUnique: vi.fn(), create: vi.fn() },
    expense: { create: vi.fn() },
  },
}));

import { Prisma } from "@/generated/prisma/client";
import { materializeRecurring } from "@/lib/recurring";
import { prisma } from "@/lib/prisma";

const fixed = {
  id: "r1",
  label: "Loyer",
  type: "FIXED",
  amount: new Prisma.Decimal("800"),
  category: "essential",
  subcategory: "housing",
  frequency: "MONTHLY",
  anchorMonth: "2026-01",
  endMonth: null,
  active: true,
};
const variable = {
  ...fixed,
  id: "r2",
  label: "Électricité",
  type: "VARIABLE",
  subcategory: "bills",
};

describe("materializeRecurring", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an APPLIED expense for FIXED and a PENDING occurrence for VARIABLE", async () => {
    vi.mocked(prisma.recurringExpense.findMany).mockResolvedValue([fixed, variable] as never);
    vi.mocked(prisma.recurringOccurrence.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.expense.create).mockResolvedValue({ id: "e1" } as never);

    await materializeRecurring("2026-03");

    expect(prisma.expense.create).toHaveBeenCalledTimes(1);
    expect(prisma.recurringOccurrence.create).toHaveBeenCalledTimes(2);
    const statuses = vi
      .mocked(prisma.recurringOccurrence.create)
      .mock.calls.map((c) => (c[0] as { data: { status: string } }).data.status);
    expect(statuses).toContain("APPLIED");
    expect(statuses).toContain("PENDING");
  });

  it("skips a model that already has an occurrence for the month", async () => {
    vi.mocked(prisma.recurringExpense.findMany).mockResolvedValue([fixed] as never);
    vi.mocked(prisma.recurringOccurrence.findUnique).mockResolvedValue({ id: "o1" } as never);

    await materializeRecurring("2026-03");

    expect(prisma.expense.create).not.toHaveBeenCalled();
    expect(prisma.recurringOccurrence.create).not.toHaveBeenCalled();
  });

  it("skips a non-trigger month (quarterly off-cycle)", async () => {
    vi.mocked(prisma.recurringExpense.findMany).mockResolvedValue([
      { ...fixed, frequency: "QUARTERLY" },
    ] as never);
    vi.mocked(prisma.recurringOccurrence.findUnique).mockResolvedValue(null as never);

    await materializeRecurring("2026-03");

    expect(prisma.recurringOccurrence.create).not.toHaveBeenCalled();
  });
});
