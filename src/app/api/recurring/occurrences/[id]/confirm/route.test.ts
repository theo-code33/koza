// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    recurringOccurrence: { findUnique: vi.fn(), update: vi.fn() },
    expense: { create: vi.fn() },
  },
}));
vi.mock("@/lib/current-user", () => ({ getCurrentUserId: vi.fn().mockResolvedValue("u1") }));

import { Prisma } from "@/generated/prisma/client";
import { POST } from "@/app/api/recurring/occurrences/[id]/confirm/route";
import { prisma } from "@/lib/prisma";

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (b: unknown) =>
  new Request("http://localhost/x", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(b),
  });

describe("confirm occurrence", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates the expense and marks the occurrence CONFIRMED", async () => {
    vi.mocked(prisma.recurringOccurrence.findUnique).mockResolvedValue({
      id: "o1",
      userId: "u1",
      month: "2026-06",
      status: "PENDING",
      expenseId: null,
      recurringId: "r1",
      recurring: {
        amount: new Prisma.Decimal("90"),
        category: "essential",
        subcategory: "bills",
        label: "Élec",
      },
    } as never);
    vi.mocked(prisma.expense.create).mockResolvedValue({ id: "e9" } as never);

    const res = await POST(req({ amount: "104.30" }), params("o1"));
    expect(res.status).toBe(200);
    expect(prisma.expense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ month: "2026-06", recurringId: "r1" }),
      }),
    );
    expect(prisma.recurringOccurrence.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "o1" },
        data: expect.objectContaining({ status: "CONFIRMED", expenseId: "e9" }),
      }),
    );
  });

  it("returns 400 on a bad amount", async () => {
    const res = await POST(req({ amount: "0" }), params("o1"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the occurrence is missing", async () => {
    vi.mocked(prisma.recurringOccurrence.findUnique).mockResolvedValue(null as never);
    const res = await POST(req({ amount: "10" }), params("x"));
    expect(res.status).toBe(404);
  });

  it("returns 409 when already confirmed", async () => {
    vi.mocked(prisma.recurringOccurrence.findUnique).mockResolvedValue({
      userId: "u1",
      status: "CONFIRMED",
    } as never);
    const res = await POST(req({ amount: "10" }), params("o1"));
    expect(res.status).toBe(409);
  });
});
