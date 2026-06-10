// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    expense: { update: vi.fn(), delete: vi.fn(), findUnique: vi.fn() },
    monthlyPeriod: { findUnique: vi.fn() },
  },
}));

import { Prisma } from "@/generated/prisma/client";
import { PUT, DELETE } from "@/app/api/expenses/[id]/route";
import { prisma } from "@/lib/prisma";

const validBody = {
  amount: "60.00",
  description: "Restaurant",
  date: "2026-06-11",
  category: "leisure",
  subcategory: "restaurants",
};

function putRequest(body: unknown): Request {
  return new Request("http://localhost/api/expenses/e1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const notFound = new Prisma.PrismaClientKnownRequestError("missing", {
  code: "P2025",
  clientVersion: "7",
});

describe("PUT /api/expenses/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates an expense and returns 200", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.expense.update).mockResolvedValue({ id: "e1" } as never);
    const res = await PUT(putRequest(validBody), params("e1"));
    expect(res.status).toBe(200);
    expect(prisma.expense.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: {
        amount: "60.00",
        description: "Restaurant",
        category: "leisure",
        subcategory: "restaurants",
        date: new Date("2026-06-11"),
        month: "2026-06",
      },
    });
  });

  it("returns 400 on an invalid payload", async () => {
    const res = await PUT(putRequest({ ...validBody, amount: "0" }), params("e1"));
    expect(res.status).toBe(400);
    expect(prisma.expense.update).not.toHaveBeenCalled();
  });

  it("returns 409 on a closed month", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue({ closedAt: new Date() } as never);
    const res = await PUT(putRequest(validBody), params("e1"));
    expect(res.status).toBe(409);
    expect(prisma.expense.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the expense does not exist", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.expense.update).mockRejectedValue(notFound);
    const res = await PUT(putRequest(validBody), params("nope"));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/expenses/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes an expense and returns 200", async () => {
    vi.mocked(prisma.expense.findUnique).mockResolvedValue({ month: "2026-06" } as never);
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.expense.delete).mockResolvedValue({ id: "e1" } as never);
    const res = await DELETE(
      new Request("http://localhost/api/expenses/e1", { method: "DELETE" }),
      params("e1"),
    );
    expect(res.status).toBe(200);
    expect(prisma.expense.delete).toHaveBeenCalledWith({ where: { id: "e1" } });
  });

  it("returns 409 when deleting in a closed month", async () => {
    vi.mocked(prisma.expense.findUnique).mockResolvedValue({ month: "2026-01" } as never);
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue({ closedAt: new Date() } as never);
    const res = await DELETE(
      new Request("http://localhost/api/expenses/e1", { method: "DELETE" }),
      params("e1"),
    );
    expect(res.status).toBe(409);
    expect(prisma.expense.delete).not.toHaveBeenCalled();
  });

  it("returns 404 when the expense does not exist", async () => {
    vi.mocked(prisma.expense.findUnique).mockResolvedValue(null as never);
    const res = await DELETE(
      new Request("http://localhost/api/expenses/nope", { method: "DELETE" }),
      params("nope"),
    );
    expect(res.status).toBe(404);
  });
});
