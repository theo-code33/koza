// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    monthlyPeriod: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    income: { findMany: vi.fn() },
    expense: { findMany: vi.fn() },
    recurringOccurrence: { updateMany: vi.fn() },
  },
}));
vi.mock("@/lib/recurring", () => ({ materializeRecurring: vi.fn() }));

import { Prisma } from "@/generated/prisma/client";
import { reconcile } from "@/lib/period";
import { prisma } from "@/lib/prisma";
import { materializeRecurring } from "@/lib/recurring";

describe("reconcile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.income.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.expense.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.monthlyPeriod.create).mockResolvedValue({ id: "new" } as never);
  });

  it("creates the current period with carryIn 0 on first run", async () => {
    vi.mocked(prisma.monthlyPeriod.findFirst).mockResolvedValue(null as never);

    await reconcile(new Date("2026-06-10"));

    expect(prisma.monthlyPeriod.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ month: "2026-06" }) }),
    );
    expect(materializeRecurring).toHaveBeenCalledWith("2026-06");
  });

  it("closes the previous month and carries the surplus forward", async () => {
    vi.mocked(prisma.monthlyPeriod.findFirst).mockResolvedValue({
      id: "p5",
      month: "2026-05",
      carryIn: new Prisma.Decimal("0"),
      closedAt: null,
    } as never);
    vi.mocked(prisma.income.findMany).mockResolvedValue([{ amount: "2800" }] as never);
    vi.mocked(prisma.expense.findMany).mockResolvedValue([{ amount: "2200" }] as never);

    await reconcile(new Date("2026-06-10"));

    expect(prisma.monthlyPeriod.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "p5" },
        data: expect.objectContaining({ carryOut: expect.anything(), closedAt: expect.any(Date) }),
      }),
    );
    const created = vi
      .mocked(prisma.monthlyPeriod.create)
      .mock.calls.find((c) => (c[0] as { data: { month: string } }).data.month === "2026-06");
    expect((created?.[0] as { data: { carryIn: Prisma.Decimal } }).data.carryIn.toString()).toBe(
      "600",
    );
    expect(materializeRecurring).toHaveBeenCalledWith("2026-06");
  });

  it("does nothing when the latest period is already the current month", async () => {
    vi.mocked(prisma.monthlyPeriod.findFirst).mockResolvedValue({
      id: "p6",
      month: "2026-06",
      carryIn: new Prisma.Decimal("0"),
      closedAt: null,
    } as never);

    await reconcile(new Date("2026-06-10"));

    expect(prisma.monthlyPeriod.update).not.toHaveBeenCalled();
    expect(prisma.monthlyPeriod.create).not.toHaveBeenCalled();
  });
});
