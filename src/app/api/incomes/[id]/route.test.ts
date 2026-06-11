// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    income: { update: vi.fn(), delete: vi.fn(), findFirst: vi.fn() },
    monthlyPeriod: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/current-user", () => ({ getCurrentUserId: vi.fn().mockResolvedValue("u1") }));

import { PUT, DELETE } from "@/app/api/incomes/[id]/route";
import { prisma } from "@/lib/prisma";

function putRequest(body: unknown): Request {
  return new Request("http://localhost/api/incomes/abc", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("PUT /api/incomes/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates an income and returns 200", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.income.findFirst).mockResolvedValue({ id: "abc" } as never);
    vi.mocked(prisma.income.update).mockResolvedValue({ id: "abc" } as never);
    const res = await PUT(
      putRequest({ source: "Prime", amount: "500.00", month: "2026-06" }),
      params("abc"),
    );
    expect(res.status).toBe(200);
    expect(prisma.income.findFirst).toHaveBeenCalledWith({ where: { id: "abc", userId: "u1" } });
    expect(prisma.income.update).toHaveBeenCalledWith({
      where: { id: "abc" },
      data: { source: "Prime", amount: "500.00", month: "2026-06", date: new Date(2026, 5, 1) },
    });
  });

  it("returns 400 on an invalid payload", async () => {
    const res = await PUT(putRequest({ source: "", amount: "0", month: "x" }), params("abc"));
    expect(res.status).toBe(400);
    expect(prisma.income.update).not.toHaveBeenCalled();
  });

  it("returns 409 on a closed month", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue({ closedAt: new Date() } as never);
    const res = await PUT(
      putRequest({ source: "Prime", amount: "500.00", month: "2026-01" }),
      params("abc"),
    );
    expect(res.status).toBe(409);
    expect(prisma.income.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the income is not owned", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.income.findFirst).mockResolvedValue(null as never);
    const res = await PUT(
      putRequest({ source: "Prime", amount: "500.00", month: "2026-06" }),
      params("nope"),
    );
    expect(res.status).toBe(404);
    expect(prisma.income.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/incomes/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes an income and returns 200", async () => {
    vi.mocked(prisma.income.findFirst).mockResolvedValue({ month: "2026-06" } as never);
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.income.delete).mockResolvedValue({ id: "abc" } as never);
    const res = await DELETE(
      new Request("http://localhost/api/incomes/abc", { method: "DELETE" }),
      params("abc"),
    );
    expect(res.status).toBe(200);
    expect(prisma.income.delete).toHaveBeenCalledWith({ where: { id: "abc" } });
  });

  it("returns 404 when the income is not owned", async () => {
    vi.mocked(prisma.income.findFirst).mockResolvedValue(null as never);
    const res = await DELETE(
      new Request("http://localhost/api/incomes/nope", { method: "DELETE" }),
      params("nope"),
    );
    expect(res.status).toBe(404);
    expect(prisma.income.delete).not.toHaveBeenCalled();
  });
});
