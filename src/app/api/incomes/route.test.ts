// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    income: { create: vi.fn(), findMany: vi.fn() },
    monthlyPeriod: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/current-user", () => ({ getCurrentUserId: vi.fn().mockResolvedValue("u1") }));

import { POST, GET } from "@/app/api/incomes/route";
import { prisma } from "@/lib/prisma";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/incomes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/incomes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an income and returns 201", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.income.create).mockResolvedValue({ id: "abc" } as never);
    const res = await POST(postRequest({ source: "Salaire", amount: "2500.00", month: "2026-06" }));
    expect(res.status).toBe(201);
    expect(prisma.income.create).toHaveBeenCalledWith({
      data: {
        source: "Salaire",
        amount: "2500.00",
        month: "2026-06",
        userId: "u1",
        date: new Date(2026, 5, 1),
      },
    });
  });

  it("rejects an invalid payload with 400", async () => {
    const res = await POST(postRequest({ source: "", amount: "-5", month: "nope" }));
    expect(res.status).toBe(400);
    expect(prisma.income.create).not.toHaveBeenCalled();
  });

  it("rejects a POST on a closed month with 409", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue({ closedAt: new Date() } as never);
    const res = await POST(postRequest({ source: "Salaire", amount: "2500.00", month: "2026-01" }));
    expect(res.status).toBe(409);
    expect(prisma.income.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/incomes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists incomes for the requested month", async () => {
    vi.mocked(prisma.income.findMany).mockResolvedValue([{ id: "1" }] as never);
    const res = await GET(new Request("http://localhost/api/incomes?month=2026-06"));
    expect(res.status).toBe(200);
    expect(prisma.income.findMany).toHaveBeenCalledWith({
      where: { userId: "u1", month: "2026-06" },
      orderBy: { createdAt: "asc" },
    });
    await expect(res.json()).resolves.toEqual([{ id: "1" }]);
  });
});
